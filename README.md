# SkillKit: Ijarah-Based Vocational Tool Leasing

**BS FinTech · FAST University Islamabad · Web Engineering**
**Instructor:** Arsalan Khan | **Team:** Mahnoor Junaid · Manahil Khattak · Noor-e-Zahra · Taha Haider

---

## The Idea
Like rent-a-car — but for tools. NAVTTC graduates lease a professional starter kit (e.g. Hilti Drill, Pipe Threader) for 12 months via halal Ijarah. They pay monthly rent (~PKR 4,500) from a digital wallet instead of taking an interest-bearing loan.

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | React.js + Vite + React Router + Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Uploads | Multer |

---

## Key Models
| Model | Purpose |
|---|---|
| `User` | Lessee account (CNIC, institute, trade) |
| `ToolKit` | Master catalog — kit type (e.g. Plumbing Starter Kit) |
| **`ToolItem`** | **Individual physical kit** — serial number, condition, status, current lessee |
| `Application` | Lease application with uploaded CNIC + certificate |
| `Lease` | Active rental contract linking user ↔ specific item |
| `LeasePayment` | 12 auto-generated monthly installment records per lease |
| `Wallet` | Lessee's digital balance for paying installments |
| `Transaction` | Wallet operations (deposit, withdraw, lease_payment) |
| `Notification` | In-app alerts |
| `AuditLog` | Admin action log |

---

## Setup

### 1. MongoDB Atlas
Get connection string from cloud.mongodb.com

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed           # creates admin + 3 test lessees + 5 kit types + physical items
npm start              # runs on http://localhost:5000
```

**Seeded credentials:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@skillkit.pk | Admin@1234 |
| Lessee | hamza@test.com | Test@1234 |
| Lessee | anand@test.com | Test@1234 |

### 3. Frontend
```bash
cd frontend
npm install
npm run dev            # runs on http://localhost:5173
```

---

## Complete User Flow

1. **Lessee registers** → wallet auto-created
2. **Lessee deposits** PKR into wallet (subject to suspicious transaction rules)
3. **Lessee applies** for a kit type → uploads CNIC + NAVTTC cert
4. **Admin reviews** application → selects specific physical item by serial number → approves
5. **System auto-generates** 12 LeasePayment documents with due dates
6. **Item status** changes to `on_lease`, item records current lessee
7. **Lessee pays monthly** from wallet → LeasePayment marked `paid` → wallet debited
8. **After 12 months** → lease auto-completes → lessee returns item → item back to `available`

---

## Suspicious Transaction Rules (wallet deposits/withdrawals)
1. Amount > PKR 200,000
2. More than 5 wallet ops in 10 minutes
3. More than 3 failed transactions in one day
4. Same amount deposited 3+ times in 24 hours
5. Account < 7 days old deposits > PKR 50,000

---

## Deployment
| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

Set `CLIENT_URL` on Render to your Vercel URL for CORS.
Set `VITE_API_URL` on Vercel to your Render backend URL.
