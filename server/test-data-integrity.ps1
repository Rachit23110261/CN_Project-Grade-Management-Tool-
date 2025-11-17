# 🧪 Data Integrity Fixes Test Script (PowerShell)
# Tests for: Division by Zero, Policy Validation, Max Marks Enforcement

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Data Integrity Fixes Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER_URL = "http://localhost:5000"
$PROFESSOR_TOKEN = "<replace-with-professor-token>"
$STUDENT_TOKEN = "<replace-with-student-token>"
$COURSE_ID = "<replace-with-course-id>"

Write-Host "📋 Prerequisites:" -ForegroundColor Yellow
Write-Host "  - Server running on $SERVER_URL"
Write-Host "  - Professor token set in script"
Write-Host "  - Student token set in script"
Write-Host "  - Course ID set in script"
Write-Host ""

# ============================================
# TEST 1: Division by Zero (StdDev = 0)
# ============================================
Write-Host "==================================" -ForegroundColor Green
Write-Host "TEST 1: Division by Zero Handling" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Create course with grading policy..."
$body1 = @{
    name = "Test Course - StdDev=0"
    code = "TEST101"
    policy = @{
        midsem = 40
        endsem = 40
        quizzes = 20
    }
    maxMarks = @{
        midsem = 100
        endsem = 100
        quiz1 = 100
    }
    quizCount = 1
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$SERVER_URL/api/courses/create" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body1
    Write-Host "✅ Course created: $($response1.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 2: Give all students identical scores (80%)..."
$body2 = @{
    grades = @{
        student1 = @{ midsem = 80; endsem = 80; quiz1 = 80 }
        student2 = @{ midsem = 80; endsem = 80; quiz1 = 80 }
        student3 = @{ midsem = 80; endsem = 80; quiz1 = 80 }
    }
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "$SERVER_URL/api/grades/$COURSE_ID" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body2
    Write-Host "✅ Grades updated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 3: Publish letter grades..."
try {
    $response3 = Invoke-RestMethod -Uri "$SERVER_URL/api/courses/$COURSE_ID/publish-grades" `
        -Method Put `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN" }
    Write-Host "✅ Letter grades published" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 4: Check student grades (should get letter grade 'A')..."
try {
    $response4 = Invoke-RestMethod -Uri "$SERVER_URL/api/grades/student/$COURSE_ID" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $STUDENT_TOKEN" }
    Write-Host "Letter Grade: $($response4.letterGrade)"
    if ($response4.letterGrade -eq "A") {
        Write-Host "✅ PASS: Letter grade assigned correctly (stdDev=0 handled)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Expected 'A', got '$($response4.letterGrade)'" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ============================================
# TEST 2: Policy Percentage Validation
# ============================================
Write-Host "==================================" -ForegroundColor Green
Write-Host "TEST 2: Policy Validation" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

Write-Host "Test 2a: Create course with policy totaling 120% (SHOULD FAIL)..."
$body2a = @{
    name = "Invalid Course"
    code = "INVALID120"
    policy = @{
        midsem = 40
        endsem = 50
        quizzes = 30
    }
} | ConvertTo-Json

try {
    $response2a = Invoke-RestMethod -Uri "$SERVER_URL/api/courses/create" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body2a
    Write-Host "❌ FAIL: Should have rejected policy totaling 120%" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS: Policy correctly rejected (HTTP 400)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PARTIAL: Rejected but wrong status ($statusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "Test 2b: Create course with negative policy (SHOULD FAIL)..."
$body2b = @{
    name = "Invalid Course"
    code = "INVALIDNEG"
    policy = @{
        midsem = -10
        endsem = 60
        quizzes = 50
    }
} | ConvertTo-Json

try {
    $response2b = Invoke-RestMethod -Uri "$SERVER_URL/api/courses/create" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body2b
    Write-Host "❌ FAIL: Should have rejected negative policy" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS: Negative policy correctly rejected (HTTP 400)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PARTIAL: Rejected but wrong status ($statusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "Test 2c: Create course with valid policy (SHOULD SUCCEED)..."
$body2c = @{
    name = "Valid Course"
    code = "VALID100"
    policy = @{
        midsem = 30
        endsem = 40
        quizzes = 20
        assignment = 10
    }
} | ConvertTo-Json

try {
    $response2c = Invoke-RestMethod -Uri "$SERVER_URL/api/courses/create" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body2c
    Write-Host "✅ PASS: Valid policy accepted (HTTP 201)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: Valid policy should be accepted" -ForegroundColor Red
}
Write-Host ""

# ============================================
# TEST 3: Max Marks Enforcement
# ============================================
Write-Host "==================================" -ForegroundColor Green
Write-Host "TEST 3: Max Marks Enforcement" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

Write-Host "Test 3a: Enter marks exceeding maxMarks (150/100) (SHOULD FAIL)..."
$body3a = @{
    grades = @{
        student1 = @{ midsem = 150 }
    }
} | ConvertTo-Json -Depth 10

try {
    $response3a = Invoke-RestMethod -Uri "$SERVER_URL/api/grades/$COURSE_ID" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body3a
    Write-Host "❌ FAIL: Should have rejected marks > maxMarks" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS: Marks exceeding max correctly rejected (HTTP 400)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PARTIAL: Rejected but wrong status ($statusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "Test 3b: Enter negative marks (-10) (SHOULD FAIL)..."
$body3b = @{
    grades = @{
        student1 = @{ midsem = -10 }
    }
} | ConvertTo-Json -Depth 10

try {
    $response3b = Invoke-RestMethod -Uri "$SERVER_URL/api/grades/$COURSE_ID" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body3b
    Write-Host "❌ FAIL: Should have rejected negative marks" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS: Negative marks correctly rejected (HTTP 400)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PARTIAL: Rejected but wrong status ($statusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "Test 3c: Enter valid marks (85/100) (SHOULD SUCCEED)..."
$body3c = @{
    grades = @{
        student1 = @{ midsem = 85; endsem = 90; quiz1 = 88 }
    }
} | ConvertTo-Json -Depth 10

try {
    $response3c = Invoke-RestMethod -Uri "$SERVER_URL/api/grades/$COURSE_ID" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body3c
    Write-Host "✅ PASS: Valid marks accepted (HTTP 200)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: Valid marks should be accepted" -ForegroundColor Red
}
Write-Host ""

Write-Host "Test 3d: Enter marks at boundary (100/100) (SHOULD SUCCEED)..."
$body3d = @{
    grades = @{
        student2 = @{ midsem = 100; endsem = 100; quiz1 = 100 }
    }
} | ConvertTo-Json -Depth 10

try {
    $response3d = Invoke-RestMethod -Uri "$SERVER_URL/api/grades/$COURSE_ID" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $PROFESSOR_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body3d
    Write-Host "✅ PASS: Perfect score accepted (HTTP 200)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: Perfect score should be accepted" -ForegroundColor Red
}
Write-Host ""

# ============================================
# SUMMARY
# ============================================
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Tests Run:" -ForegroundColor Yellow
Write-Host "  - Division by zero handling: 1 test"
Write-Host "  - Policy validation: 3 tests"
Write-Host "  - Max marks enforcement: 4 tests"
Write-Host "  - Total: 8 tests"
Write-Host ""
Write-Host "📝 Review test results above:" -ForegroundColor Yellow
Write-Host "  ✅ PASS - Test passed successfully"
Write-Host "  ❌ FAIL - Test failed, needs investigation"
Write-Host "  ⚠️  PARTIAL - Partially correct, review details"
Write-Host ""
Write-Host "✅ If all tests pass:" -ForegroundColor Green
Write-Host "   Data integrity fixes are working correctly!"
Write-Host ""
Write-Host "❌ If any test fails:" -ForegroundColor Red
Write-Host "   Review DATA_INTEGRITY_FIXES.md for troubleshooting"
Write-Host ""
