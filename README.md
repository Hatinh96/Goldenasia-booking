# OOH Booking Pro (Supabase)

Web booking quang cao OOH theo phong cach SaaS admin, co backend Supabase va cac tinh nang quan ly chinh:

- Dashboard KPI doanh thu, campaign, booking va occupancy
- Quan ly placement network (danh sach diem dat + tao moi)
- Quan ly campaign (danh sach + tao moi)
- Quan ly booking slot (danh sach + tao moi + xoa)
- Tim kiem toan he thong
- Demo mode khi chua cau hinh Supabase env

## 1) Cai dat

```bash
npm install
```

## 2) Tao backend Supabase

1. Tao 1 project tren Supabase.
2. Mo SQL Editor.
3. Chay file [supabase/schema.sql](./supabase/schema.sql).

## 3) Cau hinh env

Tao file `.env.local` tu `.env.example`:

```bash
cp .env.example .env.local
```

Dien:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 4) Chay local

```bash
npm run dev
```

Mo: `http://localhost:3000`

## 5) Luu y bao mat

Trong `schema.sql` dang de policy mo (`public all`) de ban test nhanh front-end CRUD.
Khi len production, can doi sang policy theo role/auth (khong de anonymous write).

