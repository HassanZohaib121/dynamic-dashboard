## 🔧 Environment Variables

Create a `.env` file in the root of your project and add:

```
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

BETTER_AUTH_SECRET="your-secret-key" # run: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
```

---

## 🚀 Setup

1. Install dependencies

```
npm install
```

2. Create database

```
createdb mydb
```

3. Run migrations

```
npx prisma migrate dev
```

4. Start app

```
npm run dev
```

---

## 🧪 .env.example (Optional)

```
DATABASE_URL=""
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""
```

---

## ⚠️ Important Notes

* Generate a secure secret using:

```
openssl rand -base64 32
```

* In production, update:

```
BETTER_AUTH_URL="https://yourdomain.com"
```

* Restart your dev server after changing `.env`

* Do NOT commit your `.env` file

---

## 🔮 Future Updates

* Support for additional database types (e.g. MySQL, MongoDB)
* Improved database abstraction layer
* Easier database switching via configuration
* Cloud database integrations
