import React, { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  LogIn,
  LogOut,
  PackagePlus,
  RefreshCcw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "./services/api";
import "./styles/app.css";

const emptyProduct = { name: "", sku: "", price: "", quantity_in_stock: "" };
const emptyCustomer = { full_name: "", email: "", phone_number: "" };
const emptyOrder = { customer_id: "", product_id: "", quantity: "" };
const emptyLogin = { email: "", password: "" };
const emptyRegister = { full_name: "", email: "", password: "", confirm_password: "" };
const savedUser = JSON.parse(localStorage.getItem("inventoryUser") || "null");

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

function NavButton({ active, children, icon: Icon, onClick }) {
  return (
    <button className={active ? "nav-link active" : "nav-link"} onClick={onClick} type="button">
      <Icon size={16} />
      <span>{children}</span>
    </button>
  );
}

function FormField({ help, label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {help && <small>{help}</small>}
    </label>
  );
}

function SelectField({ children, help, label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
      {help && <small>{help}</small>}
    </label>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(savedUser);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
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

  function changePage(nextPage) {
    setPage(nextPage);
    setMessage(null);
  }

  function field(setter, key) {
    return (event) => setter((current) => ({ ...current, [key]: event.target.value }));
  }

  function storeUser(nextUser) {
    setUser(nextUser);
    localStorage.setItem("inventoryUser", JSON.stringify(nextUser));
  }

  async function submitLogin(event) {
    event.preventDefault();
    try {
      const nextUser = await api.auth.login(loginForm);
      storeUser(nextUser);
      setLoginForm(emptyLogin);
      setMessage({ type: "success", text: "Login successful." });
      changePage("dashboard");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirm_password) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    try {
      const { confirm_password: _confirmPassword, ...payload } = registerForm;
      const nextUser = await api.auth.register(payload);
      storeUser(nextUser);
      setRegisterForm(emptyRegister);
      setMessage({ type: "success", text: "Registration successful." });
      changePage("dashboard");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("inventoryUser");
    setMessage({ type: "success", text: "Logged out successfully." });
    setPage("login");
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

  function cancelProductEdit() {
    setEditingProductId(null);
    setProductForm(emptyProduct);
  }

  return (
    <>
      <nav className="navbar">
        <div className="brand">
          <Boxes size={22} />
          <span>Inventory & Orders</span>
        </div>
        <div className="nav-menu">
          <NavButton active={page === "dashboard"} icon={Home} onClick={() => changePage("dashboard")}>Dashboard</NavButton>
          <NavButton active={page === "products"} icon={Boxes} onClick={() => changePage("products")}>Products</NavButton>
          <NavButton active={page === "customers"} icon={Users} onClick={() => changePage("customers")}>Customers</NavButton>
          <NavButton active={page === "orders"} icon={ClipboardList} onClick={() => changePage("orders")}>Orders</NavButton>
        </div>
        <div className="nav-user">
          {user ? (
            <>
              <span className="user-name">{user.full_name}</span>
              <button className="ghost-button" onClick={logout} type="button"><LogOut size={16} />Logout</button>
            </>
          ) : (
            <>
              <button className="ghost-button" onClick={() => changePage("login")} type="button"><LogIn size={16} />Login</button>
              <button className="ghost-button" onClick={() => changePage("register")} type="button"><UserPlus size={16} />Register</button>
            </>
          )}
        </div>
      </nav>

      <main>
        <header className="topbar">
          <div>
            <h1>{pageTitle(page)}</h1>
            <p>{pageSubtitle(page)}</p>
          </div>
          <button className="icon-button" onClick={loadAll} title="Refresh data" type="button">
            <RefreshCcw size={18} />
          </button>
        </header>

        <Message message={message} />

        {page === "dashboard" && (
          <Dashboard summary={summary} products={products} orders={orders} lowStock={lowStock} loading={loading} />
        )}

        {page === "products" && (
          <ProductsPage
            products={products}
            productForm={productForm}
            setProductForm={setProductForm}
            editingProductId={editingProductId}
            field={field}
            submitProduct={submitProduct}
            startEdit={startEdit}
            cancelProductEdit={cancelProductEdit}
            remove={remove}
          />
        )}

        {page === "customers" && (
          <CustomersPage
            customers={customers}
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            field={field}
            submitCustomer={submitCustomer}
            remove={remove}
          />
        )}

        {page === "orders" && (
          <OrdersPage
            customers={customers}
            products={products}
            orders={orders}
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            lowStock={lowStock}
            loading={loading}
            field={field}
            submitOrder={submitOrder}
            remove={remove}
          />
        )}

        {page === "login" && (
          <AuthPage mode="login" form={loginForm} setForm={setLoginForm} field={field} onSubmit={submitLogin} onSwitch={() => changePage("register")} />
        )}

        {page === "register" && (
          <AuthPage mode="register" form={registerForm} setForm={setRegisterForm} field={field} onSubmit={submitRegister} onSwitch={() => changePage("login")} />
        )}
      </main>
    </>
  );
}

function pageTitle(page) {
  const titles = {
    dashboard: "Dashboard",
    products: "Products",
    customers: "Customers",
    orders: "Orders",
    login: "Login",
    register: "Register",
  };
  return titles[page];
}

function pageSubtitle(page) {
  const subtitles = {
    dashboard: "Business summary, inventory alerts, and latest order activity.",
    products: "Add, update, and remove inventory products.",
    customers: "Create customer profiles and manage contact records.",
    orders: "Create orders, view details, and track stock movement.",
    login: "Sign in to your inventory workspace.",
    register: "Create a user account for this inventory workspace.",
  };
  return subtitles[page];
}

function Dashboard({ summary, products, orders, lowStock, loading }) {
  return (
    <>
      <section className="stats-grid">
        <Stat icon={Boxes} label="Products" value={summary?.total_products ?? products.length} />
        <Stat icon={Users} label="Customers" value={summary?.total_customers ?? 0} />
        <Stat icon={ClipboardList} label="Orders" value={summary?.total_orders ?? orders.length} />
        <Stat icon={BarChart3} label="Low stock" value={summary?.low_stock_products ?? lowStock.length} />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Low Stock Products</h2>
            <span>{lowStock.length} items</span>
          </div>
          <div className="list">
            {lowStock.length === 0 && <p className="empty">No low stock products.</p>}
            {lowStock.map((product) => (
              <article className="list-row" key={product.id}>
                <div><strong>{product.name}</strong><span>{product.sku}</span></div>
                <span className="badge warn">{product.quantity_in_stock}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Recent Orders</h2>
            <span>{loading ? "Loading..." : `${orders.length} total`}</span>
          </div>
          <div className="list">
            {orders.length === 0 && <p className="empty">No orders yet.</p>}
            {orders.slice(0, 5).map((order) => (
              <article className="list-row" key={order.id}>
                <div><strong>Order #{order.id}</strong><span>{order.customer_name}</span></div>
                <strong>{money(order.total_amount)}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ProductsPage({ products, productForm, setProductForm, editingProductId, field, submitProduct, startEdit, cancelProductEdit, remove }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Product Management</h2>
        <PackagePlus size={18} />
      </div>
      <form className="form-grid" onSubmit={submitProduct}>
        <FormField
          required
          autoComplete="off"
          help="Use the business-facing product name."
          label="Product name"
          placeholder="Steel storage bin"
          value={productForm.name}
          onChange={field(setProductForm, "name")}
        />
        <FormField
          required
          autoComplete="off"
          help="Must be unique across all products."
          label="SKU/code"
          placeholder="BIN-001"
          value={productForm.sku}
          onChange={field(setProductForm, "sku")}
        />
        <FormField
          required
          help="Backend uses this price to calculate order totals."
          label="Unit price"
          min="0.01"
          placeholder="29.99"
          step="0.01"
          type="number"
          value={productForm.price}
          onChange={field(setProductForm, "price")}
        />
        <FormField
          required
          help="Stock cannot be negative."
          label="Quantity in stock"
          min="0"
          placeholder="100"
          type="number"
          value={productForm.quantity_in_stock}
          onChange={field(setProductForm, "quantity_in_stock")}
        />
        <div className="form-actions">
          {editingProductId && <button className="secondary-button" type="button" onClick={cancelProductEdit}>Cancel Edit</button>}
          <button type="submit">{editingProductId ? "Update Product" : "Add Product"}</button>
        </div>
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
    </section>
  );
}

function CustomersPage({ customers, customerForm, setCustomerForm, field, submitCustomer, remove }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Customer Management</h2>
        <Users size={18} />
      </div>
      <form className="form-grid" onSubmit={submitCustomer}>
        <FormField
          required
          autoComplete="name"
          help="Use the customer or account contact name."
          label="Full name"
          placeholder="Ava Smith"
          value={customerForm.full_name}
          onChange={field(setCustomerForm, "full_name")}
        />
        <FormField
          required
          autoComplete="email"
          help="Email must be unique."
          label="Email address"
          placeholder="ava@example.com"
          type="email"
          value={customerForm.email}
          onChange={field(setCustomerForm, "email")}
        />
        <FormField
          required
          autoComplete="tel"
          help="Include country or area code when available."
          label="Phone number"
          pattern="[0-9+()\\-\\s]{3,40}"
          placeholder="+1 555 0100"
          value={customerForm.phone_number}
          onChange={field(setCustomerForm, "phone_number")}
        />
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={() => setCustomerForm(emptyCustomer)}>Clear</button>
          <button type="submit">Add Customer</button>
        </div>
      </form>
      <div className="list">
        {customers.length === 0 && <p className="empty">No customers yet.</p>}
        {customers.map((customer) => (
          <article className="list-row" key={customer.id}>
            <div><strong>{customer.full_name}</strong><span>{customer.email} - {customer.phone_number}</span></div>
            <button className="danger" type="button" onClick={() => remove("customers", customer.id)} title="Delete customer"><Trash2 size={15} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrdersPage({ customers, products, orders, orderForm, setOrderForm, selectedOrder, setSelectedOrder, lowStock, loading, field, submitOrder, remove }) {
  const selectedProduct = products.find((product) => product.id === Number(orderForm.product_id));
  const requestedQuantity = Number(orderForm.quantity || 0);
  const estimatedTotal = selectedProduct ? Number(selectedProduct.price) * requestedQuantity : 0;
  const hasInsufficientStock = Boolean(selectedProduct && requestedQuantity > selectedProduct.quantity_in_stock);

  return (
    <section className="workspace orders">
      <div className="panel">
        <div className="panel-heading">
          <h2>Create Order</h2>
          <ClipboardList size={18} />
        </div>
        <form className="form-grid single" onSubmit={submitOrder}>
          <SelectField
            required
            help="The order will be attached to this customer."
            label="Customer"
            value={orderForm.customer_id}
            onChange={field(setOrderForm, "customer_id")}
          >
            <option value="">Select customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}
          </SelectField>
          <SelectField
            required
            help="Only products with enough inventory can be ordered."
            label="Product"
            value={orderForm.product_id}
            onChange={field(setOrderForm, "product_id")}
          >
            <option value="">Select product</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantity_in_stock} available)</option>)}
          </SelectField>
          <FormField
            required
            help={selectedProduct ? `${selectedProduct.quantity_in_stock} available in stock.` : "Select a product first."}
            label="Quantity ordered"
            min="1"
            placeholder="1"
            type="number"
            value={orderForm.quantity}
            onChange={field(setOrderForm, "quantity")}
          />
          <div className={hasInsufficientStock ? "order-preview error" : "order-preview"}>
            <span>Estimated total</span>
            <strong>{money(estimatedTotal)}</strong>
            {hasInsufficientStock && <small>Requested quantity is higher than available inventory.</small>}
          </div>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => setOrderForm(emptyOrder)}>Clear</button>
            <button disabled={hasInsufficientStock} type="submit">Create Order</button>
          </div>
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
          {orders.length === 0 && <p className="empty">No orders yet.</p>}
          {orders.map((order) => (
            <article className="list-row" key={order.id}>
              <button className="text-button" type="button" onClick={() => setSelectedOrder(order)}>
                <strong>Order #{order.id}</strong>
                <span>{order.customer_name} - {money(order.total_amount)}</span>
              </button>
              <button className="danger" type="button" onClick={() => remove("orders", order.id)} title="Cancel order"><Trash2 size={15} /></button>
            </article>
          ))}
        </div>
        {selectedOrder && (
          <aside className="details">
            <h3>Order #{selectedOrder.id}</h3>
            <p>{selectedOrder.customer_name} - {selectedOrder.customer_email}</p>
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
  );
}

function AuthPage({ mode, form, setForm, field, onSubmit, onSwitch }) {
  const isRegister = mode === "register";
  return (
    <section className="auth-wrap">
      <div className="panel auth-panel">
        <div className="panel-heading">
          <h2>{isRegister ? "Register" : "Login"}</h2>
          {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
        </div>
        <form className="form-grid single" onSubmit={onSubmit}>
          {isRegister && (
            <FormField
              required
              autoComplete="name"
              help="This name appears in the navigation bar."
              label="Full name"
              placeholder="Subrat Kumar"
              value={form.full_name}
              onChange={field(setForm, "full_name")}
            />
          )}
          <FormField
            required
            autoComplete="email"
            help="Use the email registered for this workspace."
            label="Email address"
            placeholder="you@example.com"
            type="email"
            value={form.email}
            onChange={field(setForm, "email")}
          />
          <FormField
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            help={isRegister ? "Use at least 6 characters." : "Enter your account password."}
            label="Password"
            minLength="6"
            placeholder="Minimum 6 characters"
            type="password"
            value={form.password}
            onChange={field(setForm, "password")}
          />
          {isRegister && (
            <FormField
              required
              autoComplete="new-password"
              help="Re-enter the same password to confirm."
              label="Confirm password"
              minLength="6"
              placeholder="Repeat password"
              type="password"
              value={form.confirm_password}
              onChange={field(setForm, "confirm_password")}
            />
          )}
          <div className="form-actions">
            <button type="submit">{isRegister ? "Create Account" : "Login"}</button>
          </div>
        </form>
        <button className="link-button" type="button" onClick={onSwitch}>
          {isRegister ? "Already have an account? Login" : "Need an account? Register"}
        </button>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
