-- ============================================
-- ASSISTLINK DATABASE SCHEMA
-- ============================================

-- DROP TABLES IF THEY EXIST (for clean setup)
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS measurements;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS care_centers;
DROP TABLE IF EXISTS engineers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS device_references;


-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'care-center', 'engineer', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    care_center_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN users.role IS 'patient, care-center, engineer, admin';
COMMENT ON COLUMN users.status IS 'active, inactive';


-- ============================================
-- 2. CARE CENTERS TABLE
-- ============================================
CREATE TABLE care_centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 3. ENGINEERS TABLE
-- ============================================
CREATE TABLE engineers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 4. REQUESTS TABLE
-- ============================================
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    care_center_id INTEGER NOT NULL REFERENCES care_centers(id),
    engineer_id INTEGER REFERENCES engineers(id),
    device_type VARCHAR(50) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    affected_area VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'In Progress', 'Delivered', 'Rejected')),
    submitted_date DATE DEFAULT CURRENT_DATE,
    approved_date DATE,
    rejected_date DATE,
    delivered_date DATE,
    assigned_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN requests.status IS 'Submitted, Under Review, Approved, In Progress, Delivered, Rejected';


-- ============================================
-- 5. MEASUREMENTS TABLE
-- ============================================
CREATE TABLE measurements (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    height DECIMAL(5,1),
    weight DECIMAL(5,1),
    limb_length DECIMAL(5,1),
    circumference DECIMAL(5,1),
    additional_notes TEXT,
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 6. DELIVERIES TABLE
-- ============================================
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    delivery_address TEXT NOT NULL,
    expected_delivery_date DATE,
    delivery_status VARCHAR(20) DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'In Transit', 'Delivered')),
    tracking_number VARCHAR(50),
    delivered_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 7. DEVICE REFERENCES (From AccessGUDID)
-- ============================================
CREATE TABLE device_references (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    description TEXT,
    selected_by INTEGER REFERENCES users(id),
    selected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX idx_requests_patient_id ON requests(patient_id);
CREATE INDEX idx_requests_care_center_id ON requests(care_center_id);
CREATE INDEX idx_requests_engineer_id ON requests(engineer_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_measurements_request_id ON measurements(request_id);
CREATE INDEX idx_deliveries_request_id ON deliveries(request_id);
CREATE INDEX idx_device_references_request_id ON device_references(request_id);


-- ============================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- ============================================
-- 3.1 CARE CENTERS
-- ============================================
INSERT INTO care_centers (name, location, phone, email, description) VALUES
('Metropolitan Rehab Center', 'Nairobi', '+254 20 123 4567', 'info@metropolitanrehab.ke', 'Rehabilitation & Prosthetics'),
('City Orthopedic Clinic', 'Nairobi', '+254 20 234 5678', 'info@cityorthopedic.ke', 'Orthopedic Devices'),
('National Prosthetics Institute', 'Mombasa', '+254 41 345 6789', 'info@nationalprosthetics.ke', 'Prosthetics & Orthotics'),
('St. Luke''s Rehabilitation', 'Kisumu', '+254 57 456 7890', 'info@stlukesrehab.ke', 'Physical Rehabilitation');


-- ============================================
-- 3.2 USERS (patients, care center, engineers, admin)
-- ============================================
-- Note: Passwords are hashed using bcrypt.
-- For demo, we'll use placeholder hashes.
-- In a real app, these would be properly hashed.

-- Admin
INSERT INTO users (name, email, password_hash, phone, role, status) VALUES
('Admin User', 'admin@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 700 000 000', 'admin', 'active');

-- Care Center Staff
INSERT INTO users (name, email, password_hash, phone, role, status, care_center_id) VALUES
('Dr. Amara Osei', 'amara.osei@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 745 678 901', 'care-center', 'active', 1),
('Dr. Fatima Al-Hassan', 'fatima.alhassan@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 756 789 012', 'care-center', 'active', 2);

-- Engineers
INSERT INTO users (name, email, password_hash, phone, role, status) VALUES
('John Kamau', 'john.kamau@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 712 345 678', 'engineer', 'active'),
('Mary Akinyi', 'mary.akinyi@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 767 890 123', 'engineer', 'active'),
('James Okafor', 'james.okafor@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 778 901 234', 'engineer', 'active'),
('Elena Petrov', 'elena.petrov@assistlink.com', '$2b$10$demo_hashed_password_123', '+254 778 901 235', 'engineer', 'inactive');

-- Patients
INSERT INTO users (name, email, password_hash, phone, date_of_birth, role, status, care_center_id) VALUES
('Sarah Johnson', 'sarah.johnson@email.com', '$2b$10$demo_hashed_password_123', '+254 712 345 678', '1985-03-14', 'patient', 'active', 1),
('Michael Tran', 'm.tran@email.com', '$2b$10$demo_hashed_password_123', '+254 723 456 789', '1992-07-20', 'patient', 'active', 1),
('Grace Wambui', 'g.wambui@email.com', '$2b$10$demo_hashed_password_123', '+254 734 567 890', '1978-11-02', 'patient', 'active', 1);


-- ============================================
-- 3.3 ENGINEERS TABLE (link to users)
-- ============================================
INSERT INTO engineers (user_id, specialization, status) VALUES
((SELECT id FROM users WHERE email = 'john.kamau@assistlink.com'), 'Prosthetics', 'active'),
((SELECT id FROM users WHERE email = 'mary.akinyi@assistlink.com'), 'Orthotics', 'active'),
((SELECT id FROM users WHERE email = 'james.okafor@assistlink.com'), 'Prosthetics', 'active'),
((SELECT id FROM users WHERE email = 'elena.petrov@assistlink.com'), 'Orthotics', 'inactive');


-- ============================================
-- 3.4 REQUESTS
-- ============================================
-- Request 1: Sarah Johnson - Prosthetic Limb (In Progress)
INSERT INTO requests (
    request_number, patient_id, care_center_id, engineer_id,
    device_type, reason, affected_area, notes, status, submitted_date, assigned_date
) VALUES (
    'REQ-1042',
    (SELECT id FROM users WHERE email = 'sarah.johnson@email.com'),
    1,
    (SELECT id FROM engineers WHERE user_id = (SELECT id FROM users WHERE email = 'john.kamau@assistlink.com')),
    'Prosthetic Limb',
    'New Device',
    'Left leg, below knee',
    'Lost left leg below knee in a road accident in January 2025. Seeking a prosthetic to restore mobility.',
    'In Progress',
    '2025-03-12',
    '2025-03-15'
);

-- Request 2: Sarah Johnson - Orthotic Device (Delivered)
INSERT INTO requests (
    request_number, patient_id, care_center_id, engineer_id,
    device_type, reason, affected_area, notes, status, submitted_date, assigned_date, delivered_date
) VALUES (
    'REQ-0987',
    (SELECT id FROM users WHERE email = 'sarah.johnson@email.com'),
    1,
    (SELECT id FROM engineers WHERE user_id = (SELECT id FROM users WHERE email = 'john.kamau@assistlink.com')),
    'Orthotic Device',
    'Replacement',
    'Right ankle',
    'Post-surgical ankle stabilization following ligament repair.',
    'Delivered',
    '2024-11-08',
    '2024-11-12',
    '2024-11-20'
);

-- Request 3: Michael Tran - Prosthetic Limb (Under Review)
INSERT INTO requests (
    request_number, patient_id, care_center_id,
    device_type, reason, affected_area, notes, status, submitted_date
) VALUES (
    'REQ-1038',
    (SELECT id FROM users WHERE email = 'm.tran@email.com'),
    1,
    'Prosthetic Limb',
    'New Device',
    'Right arm, below elbow',
    'Congenital limb difference. Patient is seeking their first prosthetic device. Right-hand dominant. Functional grip and ease of attachment are priorities.',
    'Under Review',
    '2025-04-10'
);

-- Request 4: Grace Wambui - Orthotic Device (Approved)
INSERT INTO requests (
    request_number, patient_id, care_center_id,
    device_type, reason, affected_area, notes, status, submitted_date, approved_date
) VALUES (
    'REQ-1031',
    (SELECT id FROM users WHERE email = 'g.wambui@email.com'),
    1,
    'Orthotic Device',
    'New Device',
    'Right ankle',
    'Foot drop following stroke. Requires AFO for daily mobility.',
    'Approved',
    '2025-04-02',
    '2025-04-05'
);

-- Request 5: Sarah Johnson - Prosthetic Limb (Approved - awaiting measurements)
INSERT INTO requests (
    request_number, patient_id, care_center_id,
    device_type, reason, affected_area, notes, status, submitted_date, approved_date
) VALUES (
    'REQ-1050',
    (SELECT id FROM users WHERE email = 'sarah.johnson@email.com'),
    1,
    'Prosthetic Limb',
    'New Device',
    'Left leg, below knee',
    'Lost left leg below knee in accident. Active lifestyle. Prefers lightweight device.',
    'Approved',
    '2025-04-15',
    '2025-04-18'
);


-- ============================================
-- 3.5 MEASUREMENTS
-- ============================================
-- Measurements for REQ-1042 (Sarah Johnson - In Progress)
INSERT INTO measurements (request_id, height, weight, limb_length, circumference, additional_notes) VALUES
(
    (SELECT id FROM requests WHERE request_number = 'REQ-1042'),
    165.0,
    72.0,
    45.0,
    38.0,
    'Patient prefers lightweight materials'
);

-- Measurements for REQ-0987 (Sarah Johnson - Delivered)
INSERT INTO measurements (request_id, height, weight, limb_length, circumference) VALUES
(
    (SELECT id FROM requests WHERE request_number = 'REQ-0987'),
    165.0,
    72.0,
    NULL,
    NULL
);

-- Measurements for REQ-1031 (Grace Wambui - Approved)
INSERT INTO measurements (request_id, height, weight, limb_length, circumference) VALUES
(
    (SELECT id FROM requests WHERE request_number = 'REQ-1031'),
    160.0,
    68.0,
    40.0,
    32.0
);


-- ============================================
-- 3.6 DELIVERIES
-- ============================================
-- Delivery for REQ-0987 (Sarah Johnson - Delivered)
INSERT INTO deliveries (request_id, delivery_address, expected_delivery_date, delivery_status, delivered_date) VALUES
(
    (SELECT id FROM requests WHERE request_number = 'REQ-0987'),
    '14 Maple Avenue, Apt 2B, Nairobi 00100',
    '2024-11-18',
    'Delivered',
    '2024-11-20'
);


-- ============================================
-- 3.7 DEVICE REFERENCES (From AccessGUDID)
-- ============================================
-- Device for REQ-1042 (Sarah Johnson - In Progress)
INSERT INTO device_references (request_id, device_name, device_id, manufacturer, description, selected_by) VALUES
(
    (SELECT id FROM requests WHERE request_number = 'REQ-1042'),
    'Ossur Proprio Foot',
    '00811632010017',
    'Ossur Americas, Inc.',
    'Microprocessor-controlled prosthetic ankle-foot system. Adapts to terrain changes in real time using embedded sensor data.',
    (SELECT id FROM users WHERE email = 'amara.osei@assistlink.com')
);

-- Device for REQ-1038 (Michael Tran - Under Review - not yet selected)
INSERT INTO device_references (request_id, device_name, device_id, manufacturer, description, selected_by) VALUES
(
    (SELECT id FROM requests WHERE request_number = 'REQ-1038'),
    'Ottobock C-Leg 4',
    '00446579289802',
    'Otto Bock HealthCare GmbH',
    'Microprocessor-controlled prosthetic knee joint for transfemoral amputees.',
    (SELECT id FROM users WHERE email = 'amara.osei@assistlink.com')
);


-- ============================================
-- VERIFY DATA
-- ============================================
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Care Centers: ' || COUNT(*) FROM care_centers;
SELECT 'Engineers: ' || COUNT(*) FROM engineers;
SELECT 'Requests: ' || COUNT(*) FROM requests;
SELECT 'Measurements: ' || COUNT(*) FROM measurements;
SELECT 'Deliveries: ' || COUNT(*) FROM deliveries;
SELECT 'Device References: ' || COUNT(*) FROM device_references;





-- -- See all users
-- SELECT id, name, email, role, status FROM users ORDER BY id;

-- -- See all requests with patient names
-- SELECT r.id, r.request_number, u.name AS patient, r.device_type, r.status, r.submitted_date
-- FROM requests r
-- JOIN users u ON r.patient_id = u.id
-- ORDER BY r.id;

-- -- See all care centers
-- SELECT * FROM care_centers;

-- -- See all engineers with user info
-- SELECT e.id, u.name, e.specialization, e.status
-- FROM engineers e
-- JOIN users u ON e.user_id = u.id;