const JsonDB = require('./database');
const db = require('../config/db');

const defaultProducts = [
  { id: "p1", name: "iPhone 16 Pro Max 256GB", brand: "Apple", price: 34990000, oldPrice: 36990000, specs: "6.9 inch Super Retina XDR OLED 120Hz | Apple A18 Pro | 256GB | Camera 48MP Zoom 5x", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80" },
  { id: "p2", name: "iPhone 16 Plus 128GB", brand: "Apple", price: 25990000, oldPrice: 27490000, specs: "6.7 inch OLED Super Retina | Chip A18 | Nút Camera Control | Pin khủng 27 giờ xem video", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80" },
  { id: "p3", name: "iPhone 15 Pro Max 256GB", brand: "Apple", price: 28990000, oldPrice: 32990000, specs: "6.7 inch OLED 120Hz | Khung Titan siêu nhẹ | A17 Pro | Cổng sạc USB-C Type 3", image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80" },
  { id: "p4", name: "iPhone 15 128GB", brand: "Apple", price: 18990000, oldPrice: 21490000, specs: "6.1 inch Dynamic Island | Camera 48MP sắc nét | Chip A16 Bionic | Kính lưng pha màu", image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=80" },
  { id: "p5", name: "Samsung Galaxy S24 Ultra 5G 256GB", brand: "Samsung", price: 27990000, oldPrice: 31990000, specs: "6.8 inch Dynamic AMOLED 2X 120Hz | Snapdragon 8 Gen 3 for Galaxy | Bút S-Pen | Galaxy AI", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80" },
  { id: "p6", name: "Samsung Galaxy Z Fold6 5G 256GB", brand: "Samsung", price: 41990000, oldPrice: 43990000, specs: "Màn gập 7.6 inch + phụ 6.3 inch | Snapdragon 8 Gen 3 | Khung Armor Aluminum mỏng nhẹ", image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80" },
  { id: "p7", name: "Samsung Galaxy Z Flip6 5G 256GB", brand: "Samsung", price: 25490000, oldPrice: 28990000, specs: "Gập vỏ sò thời thượng | FlexCam 50MP | Snapdragon 8 Gen 3 | Màn ngoài FlexWindow đa năng", image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&auto=format&fit=crop&q=80" },
  { id: "p8", name: "Samsung Galaxy S24+ 256GB", brand: "Samsung", price: 21490000, oldPrice: 24990000, specs: "6.7 inch QHD+ 120Hz | RAM 12GB đa nhiệm | Trợ lý thông minh Galaxy AI | Pin 4900mAh", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80" },
  { id: "p9", name: "Xiaomi 14 Ultra Leica 512GB", brand: "Xiaomi", price: 24990000, oldPrice: 29990000, specs: "6.73 inch LTPO OLED 120Hz | Cụm 4 Camera Leica 50MP 1 inch | Snap 8 Gen 3 | Sạc 90W", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80" },
  { id: "p10", name: "Xiaomi 14 256GB", brand: "Xiaomi", price: 16990000, oldPrice: 19990000, specs: "6.36 inch viền siêu mỏng | Ống kính quang học Leica Summilux | Snapdragon 8 Gen 3", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80" },
  { id: "p11", name: "Xiaomi Redmi Note 13 Pro+ 5G", brand: "Xiaomi", price: 8490000, oldPrice: 9990000, specs: "Màn cong 1.5K 120Hz | Camera siêu nét 200MP OIS | Sạc thần tốc 120W HyperCharge", image: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&auto=format&fit=crop&q=80" },
  { id: "p12", name: "Google Pixel 9 Pro XL 128GB", brand: "Google", price: 27500000, oldPrice: 29900000, specs: "6.8 inch Super Actua OLED 120Hz | Google Tensor G4 | Trí tuệ nhân tạo Gemini Nano tích hợp", image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=600&auto=format&fit=crop&q=80" },
  { id: "p13", name: "Google Pixel 8a 128GB", brand: "Google", price: 11990000, oldPrice: 13500000, specs: "6.1 inch Actua 120Hz | Chip Google Tensor G3 | Camera AI đỉnh cao Best Take, Magic Editor", image: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&auto=format&fit=crop&q=80" },
  { id: "p14", name: "OPPO Find N3 Flip 256GB", brand: "OPPO", price: 19990000, oldPrice: 22990000, specs: "Gập không nếp gấp | Bộ 3 camera chuyên nghiệp Hasselblad | Màn hình ngoài tiện ích", image: "https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=600&auto=format&fit=crop&q=80" },
  { id: "p15", name: "OPPO Reno12 Pro 5G 512GB", brand: "OPPO", price: 15990000, oldPrice: 17990000, specs: "Màn cong vô cực 120Hz | Chuyên gia chân dung AI Eraser | Thiết kế ánh bạc tương lai", image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80" }
];
const productDB = new JsonDB('products', defaultProducts);

function mapRowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: parseInt(row.price) || 0,
    oldPrice: parseInt(row.old_price) || parseInt(row.price) || 0,
    specs: row.specs,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class ProductModel {
  static async getAll(brand) {
    if (db.isPostgres()) {
      try {
        let sql = 'SELECT * FROM products';
        const params = [];
        if (brand && brand !== 'all') {
          params.push(brand.toLowerCase());
          sql += ' WHERE LOWER(brand) = $1';
        }
        sql += ' ORDER BY created_at ASC';
        const res = await db.query(sql, params);
        return (res.rows || []).map(mapRowToProduct);
      } catch (err) {
        console.error('Lỗi lấy sản phẩm từ Postgres:', err.message);
      }
    }

    const list = productDB.findAll();
    return (brand && brand !== 'all') ? list.filter(p => p.brand.toLowerCase() === brand.toLowerCase()) : list;
  }

  static async getById(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
        return res && res.rows[0] ? mapRowToProduct(res.rows[0]) : null;
      } catch (err) {
        console.error('Lỗi lấy chi tiết sản phẩm Postgres:', err.message);
      }
    }
    return productDB.findById(id);
  }

  static async create({ name, brand, price, oldPrice, specs, image }) {
    const id = 'p_' + Date.now();
    const pPrice = parseInt(price) || 0;
    const pOldPrice = parseInt(oldPrice || price) || pPrice;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          INSERT INTO products (id, name, brand, price, old_price, specs, image)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [id, name, brand || 'Khác', pPrice, pOldPrice, specs || '', image || '']);
        return mapRowToProduct(res.rows[0]);
      } catch (err) {
        console.error('Lỗi tạo sản phẩm Postgres:', err.message);
      }
    }

    const newProd = {
      id,
      name,
      brand: brand || 'Khác',
      price: pPrice,
      oldPrice: pOldPrice,
      specs: specs || '',
      image: image || '',
      createdAt: new Date().toISOString()
    };
    return productDB.insert(newProd);
  }

  static async update(id, fields) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const name = fields.name || existing.name;
    const brand = fields.brand || existing.brand;
    const price = parseInt(fields.price || existing.price) || 0;
    const oldPrice = parseInt(fields.oldPrice || existing.oldPrice || price) || price;
    const specs = fields.specs !== undefined ? fields.specs : existing.specs;
    const image = fields.image || existing.image;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          UPDATE products
          SET name = $1, brand = $2, price = $3, old_price = $4, specs = $5, image = $6, updated_at = NOW()
          WHERE id = $7
          RETURNING *
        `, [name, brand, price, oldPrice, specs, image, id]);
        return mapRowToProduct(res.rows[0]);
      } catch (err) {
        console.error('Lỗi sửa sản phẩm Postgres:', err.message);
      }
    }

    return productDB.update(id, { name, brand, price, oldPrice, specs, image });
  }

  static async delete(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('DELETE FROM products WHERE id = $1', [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.error('Lỗi xóa sản phẩm Postgres:', err.message);
      }
    }
    return productDB.delete(id);
  }
}

module.exports = ProductModel;
