#!/usr/bin/env python3
"""
Sunright Toast Tab 庫存監控腳本
爬取各門市的 Out of Stock 品項，寫入 Supabase inventory 表
Usage: python3 toast-inventory.py [--store alhambra] [--dry-run]
"""

import sys
import os
import json
import datetime
import argparse
import urllib.request
from playwright.sync_api import sync_playwright

# ─── Store list ────────────────────────────────────────────
STORES = [
    { 'name': 'Alhambra',      'url': 'https://order.toasttab.com/online/sunright-tea-studio-alhambra' },
    { 'name': 'Irvine',        'url': 'https://order.toasttab.com/online/sunright-tea-studio-irvine' },
    { 'name': 'Koreatown',     'url': 'https://order.toasttab.com/online/sunright-tea-studio-koreatown' },
    { 'name': 'Arcadia',       'url': 'https://order.toasttab.com/online/sunright-tea-studio-arcadia' },
    { 'name': 'Costa Mesa',    'url': 'https://order.toasttab.com/online/sunright-tea-studio-costa-mesa' },
    { 'name': 'Gardena',       'url': 'https://order.toasttab.com/online/sunright-tea-studio-gardena' },
    { 'name': 'Long Beach',    'url': 'https://order.toasttab.com/online/sunright-tea-studio-long-beach' },
    { 'name': 'Fullerton',     'url': 'https://order.toasttab.com/online/sunright-tea-studio-fullerton' },
    { 'name': 'Garden Grove',  'url': 'https://order.toasttab.com/online/sunright-tea-studio-garden-grove' },
    { 'name': 'Monterey Park', 'url': 'https://order.toasttab.com/online/sunright-tea-studio-monterey-park' },
    { 'name': 'Artesia',       'url': 'https://order.toasttab.com/online/sunright-tea-studio-artesia' },
    { 'name': 'Burlingame',    'url': 'https://order.toasttab.com/online/sunright-tea-studio-burlingame' },
    { 'name': 'Diamond Bar',   'url': 'https://order.toasttab.com/online/sunright-tea-studio-diamond-bar' },
    { 'name': 'San Gabriel',   'url': 'https://order.toasttab.com/online/sunright-tea-studio-san-gabriel' },
]

# ─── Supabase config ───────────────────────────────────────
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# ─── Scrape a single store ─────────────────────────────────
def scrape_store(page, store: dict) -> dict:
    name = store['name']
    url  = store['url']
    print(f"\n[{name}] Loading {url} ...")

    try:
        page.goto(url, wait_until='load', timeout=30000)
        page.wait_for_timeout(4000)
    except Exception as e:
        print(f"[{name}] ⚠️  Load failed: {e}")
        return { 'name': name, 'oos': [], 'all_items': [], 'error': str(e) }

    # Extract all menu items + their OOS status
    result = page.evaluate("""() => {
        const items = [];
        document.querySelectorAll('li.item').forEach(li => {
            const isOOS = li.classList.contains('outOfStock');
            // Item name: typically in an h3 or .title span
            const nameEl = li.querySelector('h3, [class*="title"], [class*="name"], [class*="itemName"]');
            const rawName = nameEl?.textContent?.trim() || '';
            if (rawName) {
                items.push({ name: rawName, oos: isOOS });
            }
        });
        return items;
    }""")

    all_items = result or []
    oos_items = [i['name'] for i in all_items if i.get('oos')]

    print(f"[{name}] Found {len(all_items)} items, {len(oos_items)} OOS")
    for item in oos_items:
        print(f"  ❌ {item}")
    if not oos_items:
        print("  ✅ All in stock")

    return { 'name': name, 'oos': oos_items, 'all_items': all_items }

# ─── Save to Supabase ──────────────────────────────────────
def save_to_supabase(store_name: str, all_items: list, dry_run: bool = False):
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    rows = []
    for item in all_items:
        rows.append({
            'location':     store_name,
            'item_name':    item['name'],
            'is_available': not item.get('oos', False),
            'checked_at':   now,
        })
    if not rows:
        return

    if dry_run:
        print(f"  [dry-run] Would upsert {len(rows)} rows for {store_name}")
        return

    # Delete old rows for this store, then insert fresh
    # DELETE
    del_url = f"{SUPABASE_URL}/rest/v1/inventory?location=eq.{urllib.parse.quote(store_name)}"
    req = urllib.request.Request(del_url, method='DELETE',
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        })
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"  ⚠️  Delete failed: {e}")

    # INSERT
    payload = json.dumps(rows).encode()
    req2 = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/inventory",
        data=payload,
        method='POST',
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        })
    try:
        urllib.request.urlopen(req2)
        print(f"  ✅ Saved {len(rows)} rows to Supabase")
    except Exception as e:
        print(f"  ⚠️  Insert failed: {e}")

# ─── Main ──────────────────────────────────────────────────
def main():
    import urllib.parse  # for quote in save_to_supabase

    parser = argparse.ArgumentParser(description='Scrape Sunright Toast Tab inventory')
    parser.add_argument('--store', help='Only scrape a specific store (e.g. alhambra)', default=None)
    parser.add_argument('--dry-run', action='store_true', help='Don\'t write to Supabase')
    args = parser.parse_args()

    stores_to_run = STORES
    if args.store:
        stores_to_run = [s for s in STORES if s['name'].lower() == args.store.lower()]
        if not stores_to_run:
            print(f"Store '{args.store}' not found. Available: {[s['name'] for s in STORES]}")
            sys.exit(1)

    print(f"🚀 Toast Tab Inventory Scraper")
    print(f"   Stores to check: {[s['name'] for s in stores_to_run]}")
    print(f"   Dry run: {args.dry_run}")

    summary = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(user_agent=(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ))

        for store in stores_to_run:
            result = scrape_store(page, store)
            summary.append(result)

            if result.get('all_items') and not result.get('error'):
                save_to_supabase(result['name'], result['all_items'], dry_run=args.dry_run)

        browser.close()

    # ─── Summary ─────────────────────────────────────────
    print("\n" + "="*50)
    print("📦 INVENTORY SUMMARY")
    print("="*50)
    oos_stores = [r for r in summary if r['oos']]
    if not oos_stores:
        print("✅ All stores fully stocked!")
    else:
        print(f"⚠️  {len(oos_stores)} store(s) have OOS items:\n")
        for r in oos_stores:
            print(f"  📍 {r['name']}:")
            for item in r['oos']:
                print(f"     ❌ {item}")
    print(f"\nTotal stores checked: {len(summary)}")
    print(f"Total OOS items: {sum(len(r['oos']) for r in summary)}")

if __name__ == '__main__':
    import urllib.parse
    main()
