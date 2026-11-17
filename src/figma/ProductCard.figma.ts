// url=https://www.figma.com/design/rUvMCTXrbWVMSQRCU9D2Ld/GearHub---Tech---Gear-Store-Design-System?node-id=23-27
// source=src/public/js/main.js
// component=ProductCard
import figma from 'figma'
const instance = figma.selectedInstance

const title = instance.findText('Title')?.textContent || 'Gói Spa Laptop Tiêu Chuẩn'
const price = instance.findText('Price')?.textContent || '79.000 ₫'

export default {
  example: figma.code`
    <div class="product-card">
      <div class="product-thumb">
        <img src="https://images.unsplash.com/..." alt="${title}">
      </div>
      <div class="product-body">
        <h3 class="product-title">${title}</h3>
        <div class="product-price">${price}</div>
        <button class="btn btn-primary" onclick="bookService()">Đặt lịch</button>
      </div>
    </div>
  `,
  id: 'gearhub-product-card',
  metadata: { nestable: false }
}
