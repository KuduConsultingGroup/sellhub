# Pixel Pantry

You are an expert full-stack engineer.
Build a small e-commerce web application for a single company that sells its own products (not a multi-vendor marketplace).

Tech Stack (preferred)
	•	Frontend: React (or Next.js), TypeScript, Tailwind CSS for styling
	•	Backend: Node.js + Express
	•	Database: PostgreSQL (with an ORM such as Prisma or Sequelize)
	•	Auth: JWT-based authentication with password hashing (e.g., bcrypt)
	•	Payments: Integrate with a common provider (e.g., Stripe) to accept credit cards and other payment methods in test mode.

If Lovable has its own default stack, keep that but follow the structure and features below.

⸻

High-Level Requirements

Build a small e-commerce platform that includes:
	1.	Public storefront (home/landing page, product listings, category pages, product detail pages, promotions)
	2.	User account area with a simple user dashboard
	3.	Super Admin dashboard (single admin role) for managing products, categories, promotions, coupons, and orders
	4.	Shopping cart and checkout flow with payment integration
	5.	Basic responsive design so it looks good on desktop, tablet, and mobile.

⸻

User Roles
	1.	Guest (not logged in)
	•	Can browse products, categories, and promotions
	•	Can add items to cart
	•	Must sign up / log in to complete checkout
	2.	Registered User (Customer)
	•	Everything a guest can do, plus:
	•	Manage profile
	•	Manage saved delivery addresses
	•	View favorites/wishlist
	•	View cart and checkout
	•	View order history (purchase history)
	•	See user-specific promotions (if linked by coupon or promotion type)
	3.	Super Admin
	•	Full access to an Admin Dashboard
	•	Manage products, categories, promotions, coupons
	•	View all orders
	•	View and edit order status
	•	Basic overview stats (e.g., number of products, total orders, latest orders)

Use role-based authorization so that only Super Admin can access admin pages.

⸻

Data Models (Suggested)

Implement database models similar to the following:
	•	User
	•	id, name, email (unique), passwordHash
	•	role: "user" or "super_admin"
	•	createdAt, updatedAt
	•	Product
	•	id, name, slug, description
	•	price
	•	mainImageUrl
	•	images (optional, can be a separate table or JSON)
	•	categoryId (FK)
	•	isNew: boolean
	•	isActive: boolean
	•	createdAt, updatedAt
	•	Category
	•	id, name, slug, description (optional)
	•	createdAt, updatedAt
	•	Promotion
	•	id, title, description
	•	bannerImageUrl (optional)
	•	startDate, endDate
	•	isActive: boolean
	•	Coupon
	•	id, code (unique)
	•	description
	•	discountType: "percentage" or "fixed"
	•	discountValue
	•	minimumOrderAmount (optional)
	•	startDate, endDate
	•	isActive: boolean
	•	Order
	•	id, userId (FK)
	•	totalAmount
	•	status: "pending" | "paid" | "shipped" | "completed" | "cancelled"
	•	paymentStatus: "pending" | "paid" | "failed"
	•	createdAt, updatedAt
	•	OrderItem
	•	id, orderId (FK)
	•	productId (FK)
	•	productNameSnapshot
	•	productPriceSnapshot
	•	quantity
	•	lineTotal
	•	Address
	•	id, userId (FK)
	•	fullName
	•	street
	•	city
	•	state
	•	postalCode
	•	country
	•	isDefault: boolean
	•	Favorite / Wishlist
	•	id, userId, productId
	•	Cart / CartItem
	•	Either:
	•	A persistent Cart/CartItem model in DB linked to userId
	•	Or store cart in session/local storage for guests, and in DB for logged-in users.

⸻

Pages & Features

1. Landing / Home Page (/)
	•	Show:
	•	Header with logo, navigation menu, login/signup buttons, cart icon with item count.
	•	Hero section introducing the store.
	•	Featured categories section.
	•	New Products section (e.g., last N products where isNew = true).
	•	Promotions banner area.
	•	Allow users to click through to:
	•	Product detail pages
	•	Category pages
	•	Promotions page

2. Product Listing by Category (/category/[slug])
	•	Show all products belonging to that category.
	•	Include basic filters/sorting (e.g., sort by price, newest).
	•	Each product card shows image, name, short description, price, and “Add to Cart” / “View Details” buttons.

3. Product Detail Page (/product/[slug])
	•	Show product image(s), name, full description, price.
	•	Button to Add to Cart.
	•	Button to Add to Favorites/Wishlist (for logged-in users).
	•	Show related products (same category) at the bottom.

4. Promotions Page (/promotions)
	•	List all active promotions from the Promotions table.
	•	Each promotion card: title, description, validity dates, and a link to related products (this can be simple: for now just a generic link back to products or category).

5. Authentication
	•	Sign Up Page (/signup)
	•	Form: name, email, password, confirm password.
	•	On success, log the user in and redirect to home or user dashboard.
	•	Login Page (/login)
	•	Email, password.
	•	On success, redirect to home or last page.
	•	Logout action that clears tokens/session.

6. Cart & Checkout
	•	Cart Page (/cart)
	•	Show list of items: product image, name, price, quantity, subtotal.
	•	Ability to:
	•	Update quantity.
	•	Remove item from cart.
	•	Show cart subtotal, apply coupon field.
	•	Show discount and order total after coupon (if valid).
	•	Button: Proceed to Checkout.
	•	Checkout Page (/checkout)
	•	Require user to be logged in.
	•	Use user’s saved addresses; allow creating a new address.
	•	Display order summary (items, subtotal, discount, total).
	•	Integrate Stripe (test mode):
	•	Ability to pay with credit card.
	•	On payment success:
	•	Create Order and OrderItems.
	•	Mark paymentStatus and status appropriately (e.g., paid, pending shipping).
	•	Empty the user’s cart.
	•	Redirect to Order Confirmation page.
	•	Order Confirmation Page (/order/[id] or /thank-you)
	•	Show summary of the completed order.

⸻

User Dashboard (/dashboard)

Create a simple, clean dashboard layout for regular users with a sidebar or tabs for:
	1.	Overview
	•	Short summary of user’s profile and recent orders.
	2.	Purchase History / Orders
	•	List of user’s past orders:
	•	Order ID, date, total, status.
	•	Click to view order details (items, status, address).
	3.	Favorites / Wishlist
	•	List of products user has favorited.
	•	Ability to remove from favorites or add to cart.
	4.	Saved Addresses
	•	List saved addresses.
	•	Add/edit/delete addresses.
	•	Mark an address as default.
	5.	Promotions for You (simple)
	•	Show active promotions and maybe highlight some coupons or banners.

⸻

Super Admin Dashboard (/admin)

Create a separate admin area only accessible to users with role super_admin. This should include:
	1.	Admin Overview
	•	Summary cards:
	•	Total products
	•	Total orders
	•	Number of active promotions
	•	Latest 5 orders
	2.	Products Management
	•	List of all products with pagination.
	•	Create / Edit / Delete products.
	•	Fields: name, slug, description, price, category, image URL(s), isNew, isActive.
	•	Ability to toggle product active/inactive.
	3.	Categories Management
	•	List, create, edit, delete categories.
	4.	Promotions Management
	•	List, create, edit, delete promotions.
	•	Set start/end dates and isActive.
	5.	Coupons Management
	•	List, create, edit, delete coupons.
	•	Fields: code, discountType, discountValue, minimumOrderAmount, start/end dates, isActive.
	6.	Orders Management
	•	List all orders (filter by status).
	•	Show order details: user, items, total, address.
	•	Ability to update order status (e.g., pending → shipped → completed).

You do not need a separate super admin creation flow; it is fine to seed an initial admin user and/or make it easy to promote a user to super_admin in the code.

⸻

Other Requirements
	•	Navigation & Layout
	•	Global header: logo, links to Home, Categories (dropdown), Promotions, Cart icon, Login/Signup or user avatar.
	•	Footer: basic links and copyright notice.
	•	Responsive design.
	•	Validation & Error Handling
	•	Validate forms (sign up, login, address, product create/edit).
	•	Display user-friendly error messages and success notifications.
	•	Seed Data
	•	Seed database with:
	•	A few categories (e.g., “Electronics”, “Clothing”, “Home & Kitchen”).
	•	10–20 sample products spread across categories.
	•	1–2 sample promotions and coupons.
	•	One super_admin user with known credentials (documented in code).

⸻

Build everything as a cohesive, working full-stack application with routing, protected routes for dashboards, and a clear folder structure for frontend and backend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sellhub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fd9c002e-6e79-4103-865f-32b2e84573a2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
