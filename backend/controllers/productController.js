const Product = require("../models/Product");
const Store = require("../models/Store");

const parseProductNumbers = ({ price, stockQuantity }) => {
  const parsedPrice = Number(price);
  const parsedStock = Number(stockQuantity);

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return { error: "Price must be a valid number greater than or equal to 0" };
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    return { error: "Stock quantity must be a whole number greater than or equal to 0" };
  }

  return { price: parsedPrice, stockQuantity: parsedStock };
};

const getAllProducts = async (req, res) => {
  try {
    const filter = { isAvailable: true };
    if (req.query.storeId) filter.store = req.query.storeId;

    const products = await Product.find(filter).populate("store", "name location availabilityStatus");
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("store", "name location availabilityStatus");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createProduct = async (req, res) => {
  const { name, price, stockQuantity, stockType, description, category, store, storeId, imageBase64 } = req.body;
  const selectedStore = store || storeId;

  if (!name || price === undefined || stockQuantity === undefined || !selectedStore) {
    return res.status(400).json({ message: "Name, price, stockQuantity, and store are required" });
  }

  try {
    const parsed = parseProductNumbers({ price, stockQuantity });
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const storeExists = await Store.exists({ _id: selectedStore });
    if (!storeExists) {
      return res.status(400).json({ message: "Selected store does not exist" });
    }

    const productData = {
      name,
      price: parsed.price,
      stockQuantity: parsed.stockQuantity,
      description,
      category,
      store: selectedStore,
    };
    if (stockType) productData.stockType = stockType;
    if (imageBase64) productData.imageUrl = imageBase64;

    const product = await Product.create(productData);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { imageBase64, storeId, ...rest } = req.body;
    const updates = { ...rest };
    if (storeId) updates.store = storeId;
    if (imageBase64) updates.imageUrl = imageBase64;

    if (updates.price !== undefined || updates.stockQuantity !== undefined) {
      const existing = await Product.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }

      const parsed = parseProductNumbers({
        price: updates.price !== undefined ? updates.price : existing.price,
        stockQuantity: updates.stockQuantity !== undefined ? updates.stockQuantity : existing.stockQuantity,
      });
      if (parsed.error) {
        return res.status(400).json({ message: parsed.error });
      }

      if (updates.price !== undefined) updates.price = parsed.price;
      if (updates.stockQuantity !== undefined) updates.stockQuantity = parsed.stockQuantity;
    }

    if (updates.store) {
      const storeExists = await Store.exists({ _id: updates.store });
      if (!storeExists) {
        return res.status(400).json({ message: "Selected store does not exist" });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAllProducts, getProduct, createProduct, updateProduct, deleteProduct };
