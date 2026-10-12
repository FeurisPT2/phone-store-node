const JsonDB = require('./database');
const defaultProducts = [
  { id: "p1", name: "iPhone 15 Pro Max 256GB", brand: "Apple", price: 29490000, oldPrice: 34990000, specs: "6.7 inch OLED 120Hz | A17 Pro | 256GB", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80" },
  { id: "p2", name: "Samsung Galaxy S24 Ultra", brand: "Samsung", price: 27990000, oldPrice: 31990000, specs: "6.8 inch 2K+ 120Hz | Snap 8 Gen 3 | 256GB", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=80" },
  { id: "p3", name: "Xiaomi 14 Ultra Leica", brand: "Xiaomi", price: 21990000, oldPrice: 24990000, specs: "6.73 inch LTPO | Snap 8 Gen 3 | 512GB", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80" }
];
const productDB = new JsonDB('products', defaultProducts);

class ProductModel {
  static getAll(brand) {
    const list = productDB.findAll();
    return (brand && brand !== 'all') ? list.filter(p => p.brand.toLowerCase() === brand.toLowerCase()) : list;
  }
  static getById(id) { return productDB.findById(id); }
}
module.exports = ProductModel;
