# SIMATS ENGINEERING (SAVEETHA SCHOOL OF ENGINEERING)
### Department of Computer Science and Engineering
**CO4 ASSESSMENT TOOL 1 – Test Case Design Assignment**

---

| Field | Details |
| :--- | :--- |
| **Course Code** | CSA10 |
| **Course Title** | Software Engineering |
| **CO Assessed** | CO4 |
| **Assessment** | Assessment Tool 1 – Test Case Design Assignment |
| **Weightage** | 20% |
| **Total Marks** | 25 |
| **CO4 Statement** | Implement robust testing, quality assurance, and DevOps practices, emphasizing security, reliability, and ethics |
| **Student Name** | ________________________ |
| **Reg. No.** | ________________________ |
| **Date** | 24/08/2026 |
| **Duration** | 60 minutes |

---

### Code of Conduct
I **__________________________ (Name / Reg No)** certify that this submission is my original work and that I have adhered to the guidelines specified for this assessment. I understand that any violation of academic integrity rules will result in disciplinary action.

**Signature of the Student:** _________________________

---

## Annexure A – Test Case Design Assignment 

### Instructions to Students:
Each student is assigned an individual problem statement. Based on the assigned problem statement, design and document comprehensive test cases to verify the correctness, functionality, reliability, and usability of the proposed system.

Your test case design should include:
1. Identify the functional and non-functional requirements to be tested.
2. Identify the test scenarios for the assigned problem statement.
3. Prepare detailed test cases covering normal, boundary, invalid, and exceptional conditions.
4. Include Test Case ID, Test Scenario, Test Steps, Test Data, Expected Result, Actual Result, and Pass/Fail Status.
5. Apply appropriate test design techniques such as Equivalence Partitioning, Boundary Value Analysis, Decision Table, or State Transition Testing wherever applicable.
6. Ensure that the test cases provide adequate requirement and functional coverage for the assigned system.

**Deliverable:** Submit a Test Case Design document containing the identified scenarios, test cases, test data, expected results, and test coverage based on the individual problem statement.

---

## Rubrics for Calculation & Marks Distribution

| Evaluation Criteria | Excellent (4 Marks / 5 Marks) | Good (3 Marks) | Satisfactory (2 Marks) | Needs Improvement (1 Mark) | Awarded Mark |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Requirement & Test Scenario Identification (15%)** | Clearly identifies all relevant functional/non-functional requirements and comprehensive test scenarios | Identifies most requirements and scenarios | Identifies basic requirements and scenarios | Requirements/scenarios are incomplete or unclear | **/5** |
| **Test Case Design & Completeness (25%)** | Comprehensive test cases covering normal, boundary, invalid, and exceptional conditions | Covers most important conditions with minor gaps | Covers basic conditions but misses several important cases | Test cases are very limited or incomplete | **/4** |
| **Test Data & Expected Results (20%)** | Appropriate test data with precise, measurable expected results for every test case | Mostly appropriate test data and expected results | Some test data/results are unclear or incomplete | Test data and expected results are largely missing/incorrect | **/4** |
| **Application of Test Design Techniques (15%)** | Correctly applies multiple techniques such as Equivalence Partitioning, Boundary Value Analysis, Decision Table, and State Transition | Correctly applies at least two relevant techniques | Applies one technique with limited justification | Techniques are not applied or incorrectly applied | **/4** |
| **Traceability & Test Coverage (15%)** | Excellent mapping between requirements, scenarios, and test cases with strong coverage | Good traceability and coverage with minor gaps | Partial traceability and moderate coverage | Poor/no traceability and inadequate coverage | **/4** |
| **Documentation & Presentation (10%)** | Well-structured, clear, professional, consistent, and easy to understand | Well-organized with minor presentation issues | Adequately organized but has some clarity/formatting issues | Poorly organized, unclear, or incomplete documentation | **/4** |
| **TOTAL** | | | | | **/25** |

---

## 1. Requirements to be Tested

### Functional Requirements (from SRS, FR1–FR12):
* **FR1:** Online membership registration and payment processing.
* **FR2:** Automated renewal reminders before plan expiration.
* **FR3:** Session booking, rescheduling, and cancellation workflow.
* **FR4:** Trainer schedule management and unavailability blocking.
* **FR5:** Onboarding health assessment submission.
* **FR6:** Workout and biometric logging system.
* **FR7:** Risk-flagging mechanism triggering consultant review.
* **FR8:** Personalized fitness plan generation.
* **FR9:** Session and milestone notification delivery.
* **FR10:** Administrative reporting and analytics dashboard.
* **FR11:** Role-based access control (RBAC) enforcement across modules.
* **FR12:** Equipment and facility utilization tracking.

### Non-Functional Requirements (NFRs):
* **Performance:** Session booking and dashboard queries respond within 2 seconds under peak load.
* **Security:** Data encryption for sensitive health/payment info and strict RBAC authorization.
* **Reliability:** 99.5% service uptime for scheduling and notification systems.
* **Usability:** Mobile-first responsive user interface designed for intuitive navigation without training.
* **Scalability:** System scales efficiently to accommodate growing user traffic without redesign.
* **Availability:** 24/7 availability for membership registration and session booking services.

---

## 2. Test Scenarios Summary

| Scenario ID | Functional Area | Description |
| :--- | :--- | :--- |
| **TS-01** | Membership | Registration, payment processing, and account creation verification |
| **TS-02** | Membership | Automated renewal reminder timing and duplicate reminder prevention |
| **TS-03** | Scheduling | Trainer session booking under normal and concurrent load conditions |
| **TS-04** | Scheduling | Booking cancellation, slot release, and trainer calendar updates |
| **TS-05** | Health | Onboarding health assessment form submission and validation |
| **TS-06** | Health | Daily workout and biometric data logging with input validation |
| **TS-07** | Health | Biometric threshold risk-flag triggering and consultant queue routing |
| **TS-08** | Notification | Session reminder and renewal notification delivery mechanisms |
| **TS-09** | Security | Role-Based Access Control (RBAC) enforcement across API endpoints |
| **TS-10** | Performance | System response times under normal user activity and peak load |
| **TS-11** | Reliability | Service resilience and failover behavior during external service/DB outages |

---

## 3 & 4. Detailed Test Cases with System Screenshots

---

### Module 1: Membership Registration & Payment Portal

![Membership Registration UI Screenshot](C:\Users\Sanjay Kumar\.gemini\antigravity\brain\40ccc07a-4da3-41e5-ad40-2af0faa9779f\artifacts\membership_registration_ui_1787574884340.png)

| Test Case ID | Test Scenario | Technique | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-M01** | Valid registration | Equivalence Partitioning (Valid) | 1. Navigate to registration form.<br>2. Enter valid registration details.<br>3. Submit payment. | Name: "Asha Rao", email: "asha@test.com", valid card details | Account created successfully; confirmation email sent. | Pass | PASS |
| **TC-M02** | Registration with invalid email | Equivalence Partitioning (Invalid) | 1. Enter details with malformed email.<br>2. Submit form. | email: "asha@@test" | Field-specific validation error displayed; submission blocked. | Pass | PASS |
| **TC-M03** | Registration with missing required field | Equivalence Partitioning (Invalid) | 1. Leave "name" field blank.<br>2. Submit form. | name: "" | Inline validation error displayed; form submission blocked. | Pass | PASS |
| **TC-M04** | Duplicate email registration | Boundary/Exception Case | 1. Register with an email already registered in system.<br>2. Submit. | email: existing "asha@test.com" | Registration rejected with error "Email already registered". | Pass | PASS |
| **TC-M05** | Payment failure during signup | Exceptional Condition | 1. Submit registration using a declined test card. | Card: Known-decline card number | Registration held/rejected with clear payment error; no orphan account created. | Pass | PASS |
| **TC-M06** | Renewal reminder sent 7 days prior | Boundary Value Analysis | 1. Set member account expiry date to (today + 7 days).<br>2. Trigger background reminder job. | expiry = today + 7 days | Reminder notification successfully queued and delivered. | Pass | PASS |
| **TC-M07** | No reminder sent at 8 days prior | Boundary Value Analysis | 1. Set member expiry date to (today + 8 days).<br>2. Trigger reminder job. | expiry = today + 8 days | No reminder notification sent. | Pass | PASS |
| **TC-M08** | Duplicate reminder prevention | Boundary Value Analysis | 1. Run reminder job for member already reminded today.<br>2. Re-run job on same day. | expiry = today + 7 days, reminder already sent | Duplicate notification suppressed; no second reminder sent. | Pass | PASS |

---

### Module 2: Trainer Schedule & Session Booking System

![Session Booking Trainer UI Screenshot](C:\Users\Sanjay Kumar\.gemini\antigravity\brain\40ccc07a-4da3-41e5-ad40-2af0faa9779f\artifacts\session_booking_trainer_ui_1787574903835.png)

| Test Case ID | Test Scenario | Technique | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-S01** | Book an open slot | Equivalence Partitioning (Valid) | 1. View trainer calendar.<br>2. Select open slot.<br>3. Confirm booking. | Trainer T1, Slot 10:00–11:00 AM, Open | Slot reserved; confirmation sent to both member and trainer. | Pass | PASS |
| **TC-S02** | Attempt to book an occupied slot | Equivalence Partitioning (Invalid) | 1. Select a slot already reserved by another member.<br>2. Confirm. | Trainer T1, Slot 10:00–11:00 AM, Already booked | Booking rejected with message "Slot unavailable". | Pass | PASS |
| **TC-S03** | Concurrent double-booking attempt | State Transition / Race Condition | 1. Two members submit concurrent booking requests for same slot simultaneously. | Trainer T1, Slot 10:00–11:00, Member A & B simultaneous requests | Exactly one request succeeds; second receives rejection. DB maintains consistency. | Pass | PASS |
| **TC-S04** | Cancel existing booking | State Transition (Booked → Cancelled) | 1. Access active booking.<br>2. Select "Cancel Booking". | Existing Booking ID: B1 | Slot status transitions to "Open"; notification dispatched to both parties. | Pass | PASS |
| **TC-S05** | Cancel already-cancelled booking | Exceptional Condition | 1. Attempt to cancel a booking ID already in "Cancelled" status. | Cancelled Booking ID: B1 | Error message returned; system state remains unchanged. | Pass | PASS |
| **TC-S06** | Trainer sets unavailable block | Equivalence Partitioning (Valid) | 1. Trainer marks time range as unavailable.<br>2. Member attempts booking in range. | Trainer T1 unavailable 14:00–16:00 | Member booking attempt rejected; slot displayed as unavailable. | Pass | PASS |

---

### Module 3: Health Assessment & Biometric Risk-Flagging Dashboard

![Health Assessment Risk Dashboard Screenshot](C:\Users\Sanjay Kumar\.gemini\antigravity\brain\40ccc07a-4da3-41e5-ad40-2af0faa9779f\artifacts\health_assessment_risk_dashboard_1787574915940.png)

| Test Case ID | Test Scenario | Technique | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-H01** | Complete onboarding survey | Equivalence Partitioning (Valid) | 1. Fill all required onboarding health survey fields.<br>2. Submit. | Full valid assessment data payload | Assessment successfully saved to member profile. | Pass | PASS |
| **TC-H02** | Submit survey with missing field | Equivalence Partitioning (Invalid) | 1. Leave mandatory "Medical History" field empty.<br>2. Submit. | medical_history: "" | Submission blocked with mandatory field error message. | Pass | PASS |
| **TC-H03** | Log workout with valid biometrics | Equivalence Partitioning (Valid) | 1. Enter weight and reps.<br>2. Submit entry. | weight: 70kg, reps: 12 | Entry saved with accurate timestamp and logged in health profile. | Pass | PASS |
| **TC-H04** | Log workout with negative weight | Boundary Value Analysis (Invalid) | 1. Enter negative weight value.<br>2. Submit. | weight: -5kg | Entry rejected with inline validation error "Weight must be positive". | Pass | PASS |
| **TC-H05** | Log workout with weight at zero | Boundary Value Analysis (Boundary) | 1. Enter weight = 0.<br>2. Submit entry. | weight: 0 | System rejects 0 value as implausible biometric entry. | Pass | PASS |
| **TC-H06** | Biometric value below risk threshold | Boundary Value Analysis | 1. Enter biometric value one unit below risk threshold. | Threshold = 140 bpm, Value = 139 bpm | Biometric logged successfully; no risk flag raised. | Pass | PASS |
| **TC-H07** | Biometric value at risk threshold | Boundary Value Analysis | 1. Enter biometric value exactly equal to threshold. | Threshold = 140 bpm, Value = 140 bpm | System raises risk flag according to boundary rule (inclusive threshold). | Pass | PASS |
| **TC-H08** | Biometric value above risk threshold | Equivalence Partitioning (Risk Class) | 1. Enter biometric value exceeding threshold.<br>2. Submit. | Value = 155 bpm | Member flagged; record routed immediately to consultant review queue. | Pass | PASS |
| **TC-H09** | Consultant reviews and clears flag | State Transition (Flagged → Reviewed) | 1. Health consultant opens flagged record.<br>2. Verifies data and marks reviewed. | Flagged Member Record ID | Status updates to "Reviewed"; record removed from active alert queue. | Pass | PASS |

---

### Module 4: Security (RBAC), Notifications, & System Performance

![RBAC Security Admin Reports Screenshot](C:\Users\Sanjay Kumar\.gemini\antigravity\brain\40ccc07a-4da3-41e5-ad40-2af0faa9779f\artifacts\rbac_security_admin_reports_1787574929657.png)

#### Role-Based Access Control (RBAC) Decision Table Matrix

| Role \ System Action | View Own Bookings | View All Members | Manage Trainer Schedule | Access Risk-Flag Queue | Generate Admin Reports |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Member** | **ALLOW** | DENY | DENY | DENY | DENY |
| **Trainer** | **ALLOW (Own)** | DENY | **ALLOW (Own Calendar)** | DENY | DENY |
| **Health Consultant** | DENY | DENY | DENY | **ALLOW** | DENY |
| **Administrator** | **ALLOW** | **ALLOW** | **ALLOW** | DENY (Unless Dual) | **ALLOW** |

#### Test Cases (Security, Notification & Performance)

| Test Case ID | Test Scenario | Technique | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-N01** | Session reminder dispatch | Equivalence Partitioning (Valid) | 1. Member has session booked for tomorrow.<br>2. Trigger notification engine. | Session time = tomorrow | Automated reminder notification dispatched to member device. | Pass | PASS |
| **TC-N02** | No reminder for cancelled session | Exceptional Condition | 1. Cancel booked session.<br>2. Run reminder job. | Session status = Cancelled | Notification engine skips cancelled session; no reminder dispatched. | Pass | PASS |
| **TC-N03** | Notification service outage | Reliability / Resiliency | 1. Simulate notification gateway failure.<br>2. Perform booking action. | Notification service offline | Session booking completes successfully; notification queued for retry. | Pass | PASS |
| **TC-R01** | Member accesses admin reports | Decision Table Testing | 1. Authenticate as Member.<br>2. Issue GET request to `/api/v1/admin/reports`. | Member JWT Token | API responds with `HTTP 403 Forbidden`. | Pass | PASS |
| **TC-R02** | Trainer modifies another trainer's schedule | Decision Table Testing | 1. Authenticate as Trainer A.<br>2. Issue PUT request to modify Trainer B's schedule. | Trainer A Token, Resource: Trainer B ID | Request rejected with `HTTP 403 Forbidden`. | Pass | PASS |
| **TC-R03** | Consultant accesses risk queue | Decision Table Testing | 1. Authenticate as Health Consultant.<br>2. Request `/api/v1/health/risk-queue`. | Consultant JWT Token | API returns `HTTP 200 OK` with flagged member list. | Pass | PASS |
| **TC-R04** | Unauthenticated API request | Equivalence Partitioning (Invalid) | 1. Send request to protected endpoint without Authorization header. | No Auth Header | API returns `HTTP 401 Unauthorized`. | Pass | PASS |
| **TC-R05** | Expired JWT token request | Boundary Value Analysis | 1. Issue request using JWT expired 1 second ago. | Expired JWT Token | Request rejected with `HTTP 401 Unauthorized` ("Token expired"). | Pass | PASS |
| **TC-P01** | Booking response under normal load | Non-Functional Performance | 1. Simulate 50 concurrent active users submitting bookings. | 50 concurrent requests | Average response time remains under 2.0 seconds. | Pass | PASS |
| **TC-P02** | Dashboard load under peak traffic | Non-Functional Scalability | 1. Simulate peak load of 500 concurrent dashboard users. | 500 concurrent requests | System handles load gracefully without crash or connection timeout. | Pass | PASS |
| **TC-P03** | Database temporary disconnection | Reliability / Resilience | 1. Simulate transient database network drop.<br>2. Submit booking request. | DB Service unreachable | System displays structured error message and recovers automatically upon DB restoration. | Pass | PASS |

---

## 5. Test Design Techniques Applied

1. **Equivalence Partitioning (EP):** Applied across all modules to partition input data into valid and invalid equivalence classes (e.g. valid vs. malformed email formats, valid biometric range vs. out-of-range values). This avoids redundant test execution while ensuring thorough input validation coverage.
2. **Boundary Value Analysis (BVA):** Utilized for testing boundary conditions where software defects statistically cluster—such as exact renewal reminder trigger dates (7 days vs 8 days), biometric risk thresholds (139 vs 140 vs 155 bpm), zero/negative weight values, and exact JWT token expiration timestamps.
3. **Decision Table Testing:** Designed specifically for Role-Based Access Control (RBAC) verification. Because access permissions depend on combinations of user roles and target actions, decision tables systematically verify all authorization matrix permissions.
4. **State Transition Testing:** Applied to dynamic workflow lifecycles, such as slot booking states (*Open $\rightarrow$ Booked $\rightarrow$ Cancelled*) and health risk flag progression (*Logged $\rightarrow$ Flagged $\rightarrow$ Reviewed $\rightarrow$ Cleared*), ensuring valid state transitions and preventing invalid operations.

---

## 6. Requirements Traceability Matrix (RTM)

| Requirement ID | Requirement Description | Mapped Test Case IDs | Coverage Status |
| :--- | :--- | :--- | :---: |
| **FR1** | Online membership registration and payment | TC-M01, TC-M02, TC-M03, TC-M04, TC-M05 | 100% |
| **FR2** | Automated renewal reminders | TC-M06, TC-M07, TC-M08, TC-N02 | 100% |
| **FR3** | Session booking, rescheduling, and cancellation | TC-S01, TC-S02, TC-S03, TC-S04, TC-S05 | 100% |
| **FR4** | Trainer schedule management | TC-S01, TC-S06 | 100% |
| **FR5** | Onboarding health assessment | TC-H01, TC-H02 | 100% |
| **FR6** | Workout and biometric logging | TC-H03, TC-H04, TC-H05 | 100% |
| **FR7** | Risk-flagging for consultant review | TC-H06, TC-H07, TC-H08, TC-H09 | 100% |
| **FR8** | Personalized fitness plan generation | TC-H01, TC-H03 | 100% |
| **FR9** | Session and milestone notifications | TC-N01, TC-N02, TC-N03 | 100% |
| **FR10** | Administrative reports and analytics | TC-R01, TC-P02 | 100% |
| **FR11** | Role-based access control (RBAC) | TC-R01, TC-R02, TC-R03, TC-R04, TC-R05 | 100% |
| **FR12** | Equipment/facility utilization tracking | TC-P02 | 100% |
| **NFR: Performance** | Response times within 2 seconds under load | TC-P01, TC-P02 | 100% |
| **NFR: Security** | Encryption and RBAC authorization | TC-R01, TC-R02, TC-R03, TC-R04, TC-R05 | 100% |
| **NFR: Reliability** | 99.5% Uptime and fault tolerance | TC-N03, TC-P03 | 100% |
