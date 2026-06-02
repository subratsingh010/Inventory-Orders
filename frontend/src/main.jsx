import React, { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BarChart3, Boxes, ClipboardList, PackagePlus, RefreshCcw, Trash2, Users } from "lucide-react";
import { api } from "./services/api";
import "./styles/app.css";

const emptyProduct = { name: "", sku: "", price: "", quantity_in_stock: "" };
const emptyCustomer = { full_name: "", email: "", phone_number: "" };
const emptyOrder = { customer_id: "", product_id: "", quantity: "" };

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function Message({ message }) {
  if (!message) return null;
  return <div className={`message ${message.type}`}>{message.text}</div>;
}

function Stat({ icon: Icon, label, value }) {
  return (
    <section className="stat">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const lowStock = useMemo(() => products.filter((product) => product.quantity_in_stock <= 5), [products]);

  async function loadAll() {
    setLoading(true);
    try {
      const [dashboard, productList, customerList, orderList] = await Promise.all([
        api.dashboard(),
        api.products.list(),
        api.customers.list(),
        api.orders.list(),
      ]);
      setSummary(dashboard);
      setProducts(productList);
      setCustomers(customerList);
      setOrders(orderList);
      setSelectedOrder((current) => orderList.find((order) => order.id === current?.id) || null);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function field(setter, key) {
    return (event) => setter((current) => ({ ...current, [key]: event.target.value }));
  }

  async function submitProduct(event) {
    event.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        quantity_in_stock: Number(productForm.quantity_in_stock),
      };
      if (editingProductId) {
        await api.products.update(editingProductId, payload);
        setMessage({ type: "success", text: "Product updated." });
      } else {
        await api.products.create(payload);
        setMessage({ type: "success", text: "Product added." });
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      await loadAll();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function submitCustomer(event) {
    event.preventDefault();
    try {
      await api.customers.create(customerForm);
      setCustomerForm(emptyCustomer);
      setMessage({ type: "success", text: "Customer added." });
      await loadAll();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    try {
      await api.orders.create({
        customer_id: Number(orderForm.customer_id),
        items: [{ product_id: Number(orderForm.product_id), quantity: Number(orderForm.quantity) }],
      });
      setOrderForm(emptyOrder);
      setMessage({ type: "success", text: "Order created and inventory updated." });
      await loadAll();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function remove(kind, id) {
    try {
      await api[kind].remove(id);
      setMessage({ type: "success", text: "Deleted successfully." });
      await loadAll();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  function startEdit(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
    });
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <h1>Inventory & Orders</h1>
          <p>Products, customers, stock, and order tracking in one workspace.</p>
        </div>
        <button className="icon-button" onClick={loadAll} title="Refresh data" type="button">
          <RefreshCcw size={18} />
        </button>
      </header>

      <Message message={message} />

      <section className="stats-grid">
        <Stat icon={Boxes} label="Products" value={summary?.total_products ?? products.length} />
        <Stat icon={Users} label="Customers" value={summary?.total_customers ?? customers.length} />
        <Stat icon={ClipboardList} label="Orders" value={summary?.total_orders ?? orders.length} />
        <Stat icon={BarChart3} label="Low stock" value={summary?.low_stock_products ?? lowStock.length} />
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="panel-heading">
            <h2>Products</h2>
            <PackagePlus size={18} />
          </div>
          <form className="form-grid" onSubmit={submitProduct}>
            <input required placeholder="Product name" value={productForm.name} onChange={field(setProductForm, "name")} />
            <input required placeholder="SKU/code" value={productForm.sku} onChange={field(setProductForm, "sku")} />
            <input required min="0.01" step="0.01" type="number" placeholder="Price" value={productForm.price} onChange={field(setProductForm, "price")} />
            <input required min="0" type="number" placeholder="Quantity" value={productForm.quantity_in_stock} onChange={field(setProductForm, "quantity_in_stock")} />
            <button type="submit">{editingProductId ? "Update Product" : "Add Product"}</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{money(product.price)}</td>
                    <td><span className={product.quantity_in_stock <= 5 ? "badge warn" : "badge"}>{product.quantity_in_stock}</span></td>
                    <td className="actions">
                      <button type="button" onClick={() => startEdit(product)}>Edit</button>
                      <button className="danger" type="button" onClick={() => remove("products", product.id)} title="Delete product"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Customers</h2>
            <Users size={18} />
          </div>
          <form className="form-grid" onSubmit={submitCustomer}>
            <input required placeholder="Full name" value={customerForm.full_name} onChange={field(setCustomerForm, "full_name")} />
            <input required type="email" placeholder="Email address" value={customerForm.email} onChange={field(setCustomerForm, "email")} />
            <input required placeholder="Phone number" value={customerForm.phone_number} onChange={field(setCustomerForm, "phone_number")} />
            <button type="submit">Add Customer</button>
          </form>
          <div className="list">
            {customers.map((customer) => (
              <article className="list-row" key={customer.id}>
                <div><strong>{customer.full_name}</strong><span>{customer.email} · {customer.phone_number}</span></div>
                <button className="danger" type="button" onClick={() => remove("customers", customer.id)} title="Delete customer"><Trash2 size={15} /></button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace orders">
        <div className="panel">
          <div className="panel-heading">
            <h2>Create Order</h2>
            <ClipboardList size={18} />
          </div>
          <form className="form-grid" onSubmit={submitOrder}>
            <select required value={orderForm.customer_id} onChange={field(setOrderForm, "customer_id")}>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}
            </select>
            <select required value={orderForm.product_id} onChange={field(setOrderForm, "product_id")}>
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantity_in_stock} available)</option>)}
            </select>
            <input required min="1" type="number" placeholder="Quantity ordered" value={orderForm.quantity} onChange={field(setOrderForm, "quantity")} />
            <button type="submit">Create Order</button>
          </form>
          {lowStock.length > 0 && (
            <div className="notice">
              Low stock: {lowStock.map((product) => `${product.name} (${product.quantity_in_stock})`).join(", ")}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Orders</h2>
            <span>{loading ? "Loading..." : `${orders.length} total`}</span>
          </div>
          <div className="list">
            {orders.map((order) => (
              <article className="list-row" key={order.id}>
                <button className="text-button" type="button" onClick={() => setSelectedOrder(order)}>
                  <strong>Order #{order.id}</strong>
                  <span>{order.customer_name} · {money(order.total_amount)}</span>
                </button>
                <button className="danger" type="button" onClick={() => remove("orders", order.id)} title="Cancel order"><Trash2 size={15} /></button>
              </article>
            ))}
          </div>
          {selectedOrder && (
            <aside className="details">
              <h3>Order #{selectedOrder.id}</h3>
              <p>{selectedOrder.customer_name} · {selectedOrder.customer_email}</p>
              {selectedOrder.items.map((item) => (
                <div className="detail-line" key={item.id}>
                  <span>{item.product_name} x {item.quantity}</span>
                  <strong>{money(item.line_total)}</strong>
                </div>
              ))}
              <div className="detail-line total"><span>Total</span><strong>{money(selectedOrder.total_amount)}</strong></div>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
