# OOH Booking Pro (Supabase)

He thong booking quang cao OOH voi dashboard quan tri, CRUD day du va validation trung slot.

## Tinh nang da hoan thien

- Dashboard KPI + analytics chart.
- Quan ly placement network.
- Tao channel moi ngay trong Placement Network.
- Tao man hinh theo tung dia diem (screen code, screen type, model, 32 slot).
- Quan ly campaign.
- Quan ly booking slot.
- Update status truc tiep tu UI (location/campaign/booking).
- Chan xung dot slot booking (frontend + DB exclusion constraint).
- Demo mode neu chua cau hinh env Supabase.

## Chay backend that (LIVE MODE)

1. Cai dependencies:
```bash
npm install
```
2. Tao Supabase project.
3. Mo SQL Editor, chay [supabase/schema.sql](./supabase/schema.sql).
4. Tao `.env.local` tu `.env.example` va dien:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
5. Chay app:
```bash
npm run dev
```
6. Mo `http://localhost:3000`.

Neu header hien `LIVE mode: connected to Supabase` thi tat ca nut CRUD dang ghi doc du lieu that.

### Neu database cu da tao truoc do

Can chay them lenh/migration de:
- bo rang buoc channel co dinh.
- tao bang `location_screens`.

```sql
alter table public.ad_locations drop constraint if exists ad_locations_channel_check;
```

Khuyen nghi: chay lai toan bo file [supabase/schema.sql](./supabase/schema.sql).

## Import file tien do booking (32 slot/man hinh)

Da co script import tu mau Excel tien do booking:

```bash
python scripts/import_booking_progress.py --input "duong_dan_file.xlsx" --output-dir "output/spreadsheet"
```

Script se xuat:
- `booking_w09_screen_inventory.csv`: danh sach man hinh/diem dat chuan hoa.
- `booking_w09_slot_week_status.csv`: trang thai tung slot theo tung tuan.
- `booking_w09_summary.json`: thong ke tong hop + kiem tra integrity 32 slot.

## Production note

`schema.sql` dang de policy mo (`public all`) de test nhanh.
Truoc khi production, can doi sang RLS theo role/auth (khong de anonymous write).
