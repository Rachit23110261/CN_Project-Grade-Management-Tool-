#!/bin/bash

# 🧪 Data Integrity Fixes Test Script
# Tests for: Division by Zero, Policy Validation, Max Marks Enforcement

echo "=================================="
echo "Data Integrity Fixes Test Suite"
echo "=================================="
echo ""

# Configuration
SERVER_URL="http://localhost:5000"
PROFESSOR_TOKEN="<replace-with-professor-token>"
STUDENT_TOKEN="<replace-with-student-token>"
COURSE_ID="<replace-with-course-id>"

echo "📋 Prerequisites:"
echo "  - Server running on $SERVER_URL"
echo "  - Professor token set in script"
echo "  - Student token set in script"
echo "  - Course ID set in script"
echo ""

# ============================================
# TEST 1: Division by Zero (StdDev = 0)
# ============================================
echo "=================================="
echo "TEST 1: Division by Zero Handling"
echo "=================================="
echo ""

echo "Step 1: Create course with grading policy..."
curl -X POST "$SERVER_URL/api/courses/create" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Course - StdDev=0",
    "code": "TEST101",
    "policy": {
      "midsem": 40,
      "endsem": 40,
      "quizzes": 20
    },
    "maxMarks": {
      "midsem": 100,
      "endsem": 100,
      "quiz1": 100
    },
    "quizCount": 1
  }'
echo ""
echo ""

echo "Step 2: Give all students identical scores (80%)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student1": {"midsem": 80, "endsem": 80, "quiz1": 80},
      "student2": {"midsem": 80, "endsem": 80, "quiz1": 80},
      "student3": {"midsem": 80, "endsem": 80, "quiz1": 80}
    }
  }'
echo ""
echo ""

echo "Step 3: Publish letter grades..."
curl -X PUT "$SERVER_URL/api/courses/$COURSE_ID/publish-grades" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN"
echo ""
echo ""

echo "Step 4: Check student grades (should get letter grade 'A')..."
curl -X GET "$SERVER_URL/api/grades/student/$COURSE_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
echo ""
echo ""

echo "✅ Expected: All students get letter grade 'A' (mean=80%)"
echo "❌ Would fail if: letterGrade is undefined/null"
echo ""

# ============================================
# TEST 2: Policy Percentage Validation
# ============================================
echo "=================================="
echo "TEST 2: Policy Validation"
echo "=================================="
echo ""

echo "Test 2a: Create course with policy totaling 120% (SHOULD FAIL)..."
curl -X POST "$SERVER_URL/api/courses/create" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Course",
    "code": "INVALID120",
    "policy": {
      "midsem": 40,
      "endsem": 50,
      "quizzes": 30
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 400 - 'Policy percentages must total 100%'"
echo ""

echo "Test 2b: Create course with negative policy (SHOULD FAIL)..."
curl -X POST "$SERVER_URL/api/courses/create" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Course",
    "code": "INVALIDNEG",
    "policy": {
      "midsem": -10,
      "endsem": 60,
      "quizzes": 50
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 400 - 'All policy percentages must be between 0 and 100'"
echo ""

echo "Test 2c: Create course with policy totaling 90% (SHOULD FAIL)..."
curl -X POST "$SERVER_URL/api/courses/create" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Course",
    "code": "INVALID90",
    "policy": {
      "midsem": 30,
      "endsem": 40,
      "quizzes": 20
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 400 - 'Policy percentages must total 100%'"
echo ""

echo "Test 2d: Create course with valid policy (SHOULD SUCCEED)..."
curl -X POST "$SERVER_URL/api/courses/create" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Valid Course",
    "code": "VALID100",
    "policy": {
      "midsem": 30,
      "endsem": 40,
      "quizzes": 20,
      "assignment": 10
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 201 - Course created successfully"
echo ""

# ============================================
# TEST 3: Max Marks Enforcement
# ============================================
echo "=================================="
echo "TEST 3: Max Marks Enforcement"
echo "=================================="
echo ""

echo "Test 3a: Enter marks exceeding maxMarks (150/100) (SHOULD FAIL)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student1": {"midsem": 150}
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 400 - 'Invalid marks: midsem mark (150) exceeds maximum (100)'"
echo ""

echo "Test 3b: Enter negative marks (-10) (SHOULD FAIL)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student1": {"midsem": -10}
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 400 - 'Invalid marks: midsem mark (-10) cannot be negative'"
echo ""

echo "Test 3c: Enter marks exceeding hard limit (1500/100) (SHOULD FAIL)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student1": {"midsem": 1500}
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 400 - Validation error (caught by middleware)"
echo ""

echo "Test 3d: Enter valid marks (85/100) (SHOULD SUCCEED)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student1": {"midsem": 85, "endsem": 90, "quiz1": 88}
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 200 - 'Grades updated successfully'"
echo ""

echo "Test 3e: Enter marks at boundary (100/100) (SHOULD SUCCEED)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student2": {"midsem": 100, "endsem": 100, "quiz1": 100}
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 200 - Perfect score accepted"
echo ""

echo "Test 3f: Enter marks at zero (0/100) (SHOULD SUCCEED)..."
curl -X POST "$SERVER_URL/api/grades/$COURSE_ID" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": {
      "student3": {"midsem": 0, "endsem": 0, "quiz1": 0}
    }
  }'
echo ""
echo ""
echo "✅ Expected: HTTP 200 - Zero marks accepted (edge case)"
echo ""

# ============================================
# SUMMARY
# ============================================
echo "=================================="
echo "Test Suite Complete"
echo "=================================="
echo ""
echo "📊 Tests Run:"
echo "  - Division by zero handling: 1 test"
echo "  - Policy validation: 4 tests"
echo "  - Max marks enforcement: 6 tests"
echo "  - Total: 11 tests"
echo ""
echo "📝 Manual Verification Required:"
echo "  1. Check all HTTP status codes match expected"
echo "  2. Verify error messages are clear and informative"
echo "  3. Confirm letter grades assigned correctly (Test 1)"
echo "  4. Ensure invalid policies rejected (Tests 2a-c)"
echo "  5. Ensure invalid marks rejected (Tests 3a-c)"
echo "  6. Ensure valid marks accepted (Tests 3d-f)"
echo ""
echo "✅ If all tests pass:"
echo "   Data integrity fixes are working correctly!"
echo ""
echo "❌ If any test fails:"
echo "   Review DATA_INTEGRITY_FIXES.md for troubleshooting"
echo ""
