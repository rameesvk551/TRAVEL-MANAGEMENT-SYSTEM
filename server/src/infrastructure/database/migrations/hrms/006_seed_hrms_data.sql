-- migrations/hrms/006_seed_hrms_data.sql
-- HRMS Module Seed Data

-- ============================================
-- DEFAULT LEAVE TYPES
-- ============================================
INSERT INTO hrms.leave_types (tenant_id, code, name, description, is_paid, max_days_per_year, max_consecutive_days, min_notice_days, allow_carry_forward, max_carry_forward, accrual_type, accrual_rate, display_order)
SELECT 
  t.id,
  lt.code,
  lt.name,
  lt.description,
  lt.is_paid,
  lt.max_days_per_year,
  lt.max_consecutive_days,
  lt.min_notice_days,
  lt.allow_carry_forward,
  lt.max_carry_forward,
  lt.accrual_type,
  lt.accrual_rate,
  lt.display_order
FROM public.tenants t
CROSS JOIN (VALUES
  ('AL', 'Annual Leave', 'Paid annual vacation leave', true, 18, 10, 7, true, 5, 'MONTHLY', 1.5, 1),
  ('SL', 'Sick Leave', 'Paid sick leave', true, 12, 5, 0, false, 0, 'ANNUAL', NULL, 2),
  ('CL', 'Casual Leave', 'Short notice personal leave', true, 6, 3, 1, false, 0, 'ANNUAL', NULL, 3),
  ('UL', 'Unpaid Leave', 'Leave without pay', false, NULL, 30, 3, false, 0, 'NONE', NULL, 4),
  ('ML', 'Maternity Leave', 'Maternity leave for expecting mothers', true, 98, 98, 30, false, 0, 'NONE', NULL, 5),
  ('PL', 'Paternity Leave', 'Paternity leave for new fathers', true, 15, 15, 7, false, 0, 'NONE', NULL, 6),
  ('BL', 'Bereavement Leave', 'Leave for family bereavement', true, 5, 5, 0, false, 0, 'NONE', NULL, 7),
  ('CO', 'Compensatory Off', 'Off in lieu of extra work days', true, NULL, 3, 1, false, 0, 'NONE', NULL, 8)
) AS lt(code, name, description, is_paid, max_days_per_year, max_consecutive_days, min_notice_days, allow_carry_forward, max_carry_forward, accrual_type, accrual_rate, display_order)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ============================================
-- DEFAULT SKILLS
-- ============================================
INSERT INTO hrms.skills (tenant_id, code, name, category, description)
SELECT 
  t.id,
  s.code,
  s.name,
  s.category,
  s.description
FROM public.tenants t
CROSS JOIN (VALUES
  -- Guiding Skills
  ('TREK_GUIDE', 'Trekking Guide', 'Guiding', 'Certified trekking guide'),
  ('MOUNT_GUIDE', 'Mountaineering Guide', 'Guiding', 'Certified mountaineering guide'),
  ('TOUR_GUIDE', 'Tour Guide', 'Guiding', 'General tour guide certification'),
  ('WILDLIFE_GUIDE', 'Wildlife Guide', 'Guiding', 'Wildlife and safari guide'),
  
  -- Language Skills
  ('LANG_EN', 'English', 'Language', 'English language proficiency'),
  ('LANG_JP', 'Japanese', 'Language', 'Japanese language proficiency'),
  ('LANG_FR', 'French', 'Language', 'French language proficiency'),
  ('LANG_DE', 'German', 'Language', 'German language proficiency'),
  ('LANG_ES', 'Spanish', 'Language', 'Spanish language proficiency'),
  ('LANG_ZH', 'Chinese', 'Language', 'Chinese language proficiency'),
  
  -- Technical Skills
  ('FIRST_AID', 'First Aid', 'Medical', 'First aid certification'),
  ('WFR', 'Wilderness First Responder', 'Medical', 'WFR certification'),
  ('ALTITUDE', 'High Altitude Training', 'Medical', 'High altitude medicine training'),
  
  -- Driving Skills
  ('DRV_4WD', '4WD Driving', 'Driving', '4WD vehicle operation'),
  ('DRV_HEAVY', 'Heavy Vehicle', 'Driving', 'Heavy vehicle license'),
  ('DRV_BIKE', 'Motorcycle', 'Driving', 'Motorcycle license'),
  
  -- Technical Equipment
  ('PHOTO', 'Photography', 'Technical', 'Professional photography skills'),
  ('VIDEO', 'Videography', 'Technical', 'Professional videography skills'),
  ('DRONE', 'Drone Operation', 'Technical', 'Drone pilot certification'),
  
  -- Outdoor Skills
  ('ROCK_CLIMB', 'Rock Climbing', 'Outdoor', 'Rock climbing instructor'),
  ('ICE_CLIMB', 'Ice Climbing', 'Outdoor', 'Ice climbing instructor'),
  ('RAFTING', 'River Rafting', 'Outdoor', 'Rafting guide certification'),
  ('KAYAK', 'Kayaking', 'Outdoor', 'Kayaking instructor'),
  
  -- Camp Skills
  ('COOK', 'Camp Cooking', 'Camp', 'Outdoor cooking skills'),
  ('CAMP_MGT', 'Camp Management', 'Camp', 'Camp setup and management')
) AS s(code, name, category, description)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ============================================
-- DEFAULT TRIP ROLE CONFIGURATIONS
-- ============================================
INSERT INTO hrms.trip_role_configs (tenant_id, trip_type, role, min_count, max_count, is_mandatory, required_skills, default_compensation_type)
SELECT 
  t.id,
  rc.trip_type,
  rc.role,
  rc.min_count,
  rc.max_count,
  rc.is_mandatory,
  rc.required_skills::jsonb,
  rc.default_compensation_type
FROM public.tenants t
CROSS JOIN (VALUES
  -- Trekking trips
  ('TREKKING', 'LEAD_GUIDE', 1, 1, true, '["TREK_GUIDE", "FIRST_AID"]', 'PER_TRIP'),
  ('TREKKING', 'ASSISTANT_GUIDE', 0, 3, false, '["TREK_GUIDE"]', 'PER_TRIP'),
  ('TREKKING', 'PORTER', 0, 20, false, '[]', 'DAILY'),
  ('TREKKING', 'COOK', 1, 2, true, '["COOK"]', 'PER_TRIP'),
  
  -- Mountaineering trips
  ('MOUNTAINEERING', 'LEAD_GUIDE', 1, 1, true, '["MOUNT_GUIDE", "WFR", "ALTITUDE"]', 'PER_TRIP'),
  ('MOUNTAINEERING', 'ASSISTANT_GUIDE', 1, 4, true, '["MOUNT_GUIDE", "FIRST_AID"]', 'PER_TRIP'),
  ('MOUNTAINEERING', 'PORTER', 2, 30, true, '[]', 'DAILY'),
  ('MOUNTAINEERING', 'COOK', 1, 2, true, '["COOK"]', 'PER_TRIP'),
  
  -- Cultural tours
  ('CULTURAL_TOUR', 'LEAD_GUIDE', 1, 1, true, '["TOUR_GUIDE"]', 'PER_TRIP'),
  ('CULTURAL_TOUR', 'DRIVER', 1, 2, true, '["DRV_4WD"]', 'DAILY'),
  
  -- Wildlife safari
  ('SAFARI', 'LEAD_GUIDE', 1, 1, true, '["WILDLIFE_GUIDE"]', 'PER_TRIP'),
  ('SAFARI', 'DRIVER', 1, 2, true, '["DRV_4WD"]', 'DAILY'),
  
  -- Adventure activities
  ('RAFTING', 'LEAD_GUIDE', 1, 1, true, '["RAFTING", "FIRST_AID"]', 'PER_TRIP'),
  ('RAFTING', 'SUPPORT', 1, 4, true, '["RAFTING"]', 'DAILY')
) AS rc(trip_type, role, min_count, max_count, is_mandatory, required_skills, default_compensation_type)
ON CONFLICT (tenant_id, trip_type, role) DO NOTHING;

-- ============================================
-- DEFAULT ATTENDANCE POLICY
-- ============================================
INSERT INTO hrms.attendance_policies (tenant_id, name, is_default, work_start_time, work_end_time, grace_period_minutes, half_day_hours, min_hours_for_full_day, overtime_after_hours, weekly_offs, require_location)
SELECT 
  t.id,
  'Default Policy',
  true,
  '09:00'::time,
  '18:00'::time,
  15,
  4,
  8,
  8,
  ARRAY[0, 6],
  true
FROM public.tenants t
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE HOLIDAYS (Nepal 2081 BS / 2024-25 AD)
-- ============================================
INSERT INTO hrms.holidays (tenant_id, name, date, type, is_optional)
SELECT 
  t.id,
  h.name,
  h.date::date,
  h.type,
  h.is_optional
FROM public.tenants t
CROSS JOIN (VALUES
  ('New Year 2082', '2025-04-14', 'NATIONAL', false),
  ('Labour Day', '2025-05-01', 'NATIONAL', false),
  ('Buddha Jayanti', '2025-05-12', 'NATIONAL', false),
  ('Republic Day', '2025-05-28', 'NATIONAL', false),
  ('Janai Purnima', '2025-08-09', 'NATIONAL', false),
  ('Krishna Janmashtami', '2025-08-16', 'NATIONAL', false),
  ('Teej', '2025-08-26', 'NATIONAL', false),
  ('Indra Jatra', '2025-09-07', 'NATIONAL', false),
  ('Constitution Day', '2025-09-19', 'NATIONAL', false),
  ('Dashain (Ghatasthapana)', '2025-09-22', 'NATIONAL', false),
  ('Dashain (Vijaya Dashami)', '2025-10-01', 'NATIONAL', false),
  ('Tihar (Laxmi Puja)', '2025-10-20', 'NATIONAL', false),
  ('Chhath Parva', '2025-10-26', 'NATIONAL', false),
  ('Christmas', '2025-12-25', 'OPTIONAL', true)
) AS h(name, date, type, is_optional)
ON CONFLICT DO NOTHING;
