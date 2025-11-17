# Changeable Grade Calculation Parameters - Implementation Summary

## Overview
Implemented a flexible grading scale system that allows professors to customize Z-score thresholds for letter grades on a per-course basis.

## Features Implemented

### 1. **Database Changes**
- ✅ Added `grading_scale` JSONB column to `courses` table
- ✅ Default values based on standard bell curve distribution
- ✅ Migration script created and executed successfully

### 2. **Backend Implementation**

#### Model Updates (`Course.js`)
- Added `gradingScale` field to course objects
- Created `updateGradingScale()` method to update grading parameters
- Default grading scale:
  ```json
  {
    "A+": 1.5,
    "A": 1.0,
    "A-": 0.5,
    "B": 0.0,
    "C": -0.5,
    "D": -1.0,
    "E": -1.5,
    "F": -2.0
  }
  ```

#### Controller Updates
- **`courseController.js`**: Added `updateGradingScale()` endpoint
- **`gradeController.js`**: Modified letter grade calculation to use course-specific grading scale

#### Routes
- Added `PUT /api/courses/:courseId/grading-scale` (professor only)

### 3. **Frontend Implementation**

#### UI Components (`GradeManagement.jsx`)
- ✅ New "Grading Scale" button in grade management toolbar
- ✅ Beautiful modal dialog for configuring grade thresholds
- ✅ Real-time Z-score threshold editing
- ✅ Educational tooltips explaining Z-score grading
- ✅ "Reset to Default" functionality
- ✅ Visual grade preview sorted by threshold

#### Modal Features
- **Header**: Clear title with explanation
- **Info Box**: Educational content about Z-score grading
- **Grade Inputs**: 
  - Each letter grade with its threshold
  - Sorted from highest to lowest
  - Visual indicators (σ symbols)
- **Reference Table**: Standard percentile distributions
- **Action Buttons**:
  - Reset to Default
  - Cancel
  - Save

## How It Works

### Grading Algorithm
1. **Calculate weighted scores** for all students in course
2. **Compute statistics**: mean and standard deviation
3. **Calculate Z-score** for each student: `(score - mean) / stdDev`
4. **Assign letter grade** based on Z-score threshold from course's grading scale

### Customization Process
1. Professor navigates to Grade Management page
2. Clicks "Grading Scale" button
3. Adjusts Z-score thresholds for each letter grade
4. Saves changes (applies to entire course)
5. All future grade calculations use new thresholds

## Technical Details

### Z-Score Interpretation
- **Z-score = 0**: Exactly at average
- **Z-score = 1**: One standard deviation above average (~84th percentile)
- **Z-score = -1**: One standard deviation below average (~16th percentile)

### Default Thresholds
| Grade | Z-Score | Approximate Percentile |
|-------|---------|----------------------|
| A+    | ≥ 1.5   | Top 7%              |
| A     | ≥ 1.0   | Top 16%             |
| A-    | ≥ 0.5   | Top 31%             |
| B     | ≥ 0.0   | Top 50% (average)   |
| C     | ≥ -0.5  | Below average       |
| D     | ≥ -1.0  | Bottom 16%          |
| E     | ≥ -1.5  | Bottom 7%           |
| F     | ≥ -2.0  | Bottom 2%           |

### Database Schema
```sql
ALTER TABLE courses 
ADD COLUMN grading_scale JSONB 
DEFAULT '{
  "A+": 1.5,
  "A": 1.0,
  "A-": 0.5,
  "B": 0.0,
  "C": -0.5,
  "D": -1.0,
  "E": -1.5,
  "F": -2.0
}'::jsonb;
```

## API Endpoints

### Update Grading Scale
```
PUT /api/courses/:courseId/grading-scale
Authorization: Bearer <token>
Role: professor

Request Body:
{
  "gradingScale": {
    "A+": 1.5,
    "A": 1.0,
    // ... other grades
  }
}

Response:
{
  "message": "Grading scale updated successfully",
  "course": { ... } // Updated course object
}
```

### Get Course Grades (includes grading scale)
```
GET /api/grades/:courseId
Authorization: Bearer <token>

Response:
{
  "course": {
    "gradingScale": { ... },
    // ... other course data
  },
  // ... grades data
}
```

## Benefits

### For Professors
- **Flexibility**: Adjust grading difficulty per course
- **Fairness**: Account for course difficulty variations
- **Control**: Fine-tune grade distribution
- **Transparency**: Students see consistent grading

### For Students
- **Understanding**: Clear view of grade thresholds
- **Predictability**: Know exactly what Z-score means for grades
- **Fairness**: Standardized approach within each course

## Testing Checklist

- [x] Database migration runs successfully
- [x] Grading scale modal opens and closes
- [x] Default values load correctly
- [x] Threshold values can be edited
- [x] Reset to default works
- [x] Save updates database
- [x] Grade calculation uses custom scale
- [x] Changes persist across sessions

## Files Modified

### Backend
1. `server/src/db/add_grading_scale.sql` - Database migration
2. `server/src/db/migrate_grading_scale.js` - Migration script
3. `server/src/models/Course.js` - Added grading scale support
4. `server/src/controllers/courseController.js` - Update endpoint
5. `server/src/controllers/gradeController.js` - Use custom scale
6. `server/src/routes/courseRoutes.js` - New route

### Frontend
1. `client/src/pages/GradeManagement.jsx` - UI and logic

## Usage Instructions

### For Professors
1. Log in as professor
2. Navigate to course grade management
3. Click "Grading Scale" button (indigo button in toolbar)
4. Adjust Z-score thresholds:
   - Higher values = stricter grading
   - Lower values = more lenient grading
5. Click "Save Grading Scale"
6. All future grade calculations will use new thresholds

### Example Scenarios

**Stricter Grading:**
```json
{
  "A+": 2.0,
  "A": 1.5,
  "A-": 1.0,
  "B": 0.5,
  // ... (fewer students get top grades)
}
```

**More Lenient Grading:**
```json
{
  "A+": 1.0,
  "A": 0.5,
  "A-": 0.0,
  "B": -0.5,
  // ... (more students get top grades)
}
```

## Future Enhancements (Optional)

- [ ] Add preset grading scales (strict, normal, lenient)
- [ ] Visual grade distribution preview
- [ ] Historical grading scale tracking
- [ ] Compare different grading scales
- [ ] Export grading scale configurations
- [ ] Clone grading scale from another course

## Notes

- Changes to grading scale do not retroactively change already-published grades
- Each course can have its own unique grading scale
- Z-score grading ensures fair relative assessment
- System maintains backward compatibility (uses defaults if not set)
