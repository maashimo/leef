import sys, re

with open('products.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '${p.sale_details ?'
end_marker = 'Add to Cart</button>'

start_idx = text.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
    sys.exit()

end_idx = text.find(end_marker, start_idx) + len(end_marker)

replacement = """${ (() => {
        let oldPrice = 0;
        let baseNum = 0;
        let suffix = String(p.price).replace(/[\\d.]+/, '').trim();
        const origMatch = String(p.price).match(/[\\d.]+/);
        if (origMatch) oldPrice = parseFloat(origMatch[0]);
        baseNum = oldPrice;

        if (p.sale_details) {
            const saleMatch = String(p.sale_details).match(/[\\d.]+/);
            if (saleMatch) baseNum = parseFloat(saleMatch[0]);
        }

        let finalNum = baseNum;
        if (p.coins_percent) {
            finalNum = baseNum - (baseNum * (parseFloat(p.coins_percent) / 100));
        }
        
        let priceHtml = '';
        if (p.sale_details && p.coins_percent) {
            priceHtml = `<div style="margin-bottom:0.8em;">
                      <span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">Rs. ${p.price}</span>
                      <span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-left:0.5em;">SALE: Rs. ${baseNum}</span>
                      <span style="display:block; font-weight:bold; color:#ef4444; font-size:1.1rem;">Rs. ${finalNum.toFixed(2)} ${suffix}</span>
                    </div>`;
        } else if (p.sale_details) {
            priceHtml = `<div style="margin-bottom:0.8em;">
                      <span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">Rs. ${p.price}</span>
                      <span style="display:block; font-weight:bold; color:#ef4444; font-size:1.1rem;">Rs. ${baseNum.toFixed(2)} ${suffix}</span>
                    </div>`;
        } else if (p.coins_percent) {
            priceHtml = `<div style="margin-bottom:0.8em;">
                      <span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">Rs. ${p.price}</span>
                      <span style="display:block; font-weight:bold; color:#ef4444; font-size:1.1rem;">Rs. ${finalNum.toFixed(2)} ${suffix}</span>
                    </div>`;
        } else {
            priceHtml = `<div style="margin-bottom:0.8em; display:flex; align-items:center; gap:0.5rem;">
                      <span class="product-price" style="font-weight:bold; color:#4ade80; font-size:1.1rem;">Rs. ${p.price}</span>
                    </div>`;
        }

        return priceHtml + `\\n                  ${coinsBadge}\\n                  <button class="btn btn-primary btn-block" style="width:100%; border-radius:0.5em; padding:0.6em;" onclick="addToCart('${p.name}', ${finalNum.toFixed(2)}, '${p.image_url}', 1, ${p.stock})">Add to Cart</button>`;
    })() }"""

new_text = text[:start_idx] + replacement + text[end_idx:]

with open('products.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Replacement successful")
