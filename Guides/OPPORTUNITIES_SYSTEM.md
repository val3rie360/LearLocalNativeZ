# Hybrid Opportunities Collection System

## Overview

This document describes the hybrid model implemented for managing opportunities in the LearnLocal Native application. The system uses a two-part strategy to optimize both performance and functionality.

## Architecture

### 1. Denormalized `opportunities` Collection (Preview Data)

The primary collection serves as a lightweight source for displaying lists of opportunities, such as in home feeds, search results, and category filters.

**Location**: `opportunities` collection in Firestore

**Purpose**: 
- Fast querying and minimal read costs
- Display opportunity cards and previews
- Support filtering and searching

**Fields Stored**:
```javascript
{
  id: string,              // Unique opportunity ID
  title: string,           // Opportunity title
  description: string,     // Brief description
  category: string,        // Category (Scholarship, Workshop, etc.)
  organizationId: string,  // Creator organization ID
  createdAt: timestamp,    // Creation timestamp
  updatedAt: timestamp,    // Last update timestamp
  status: string,          // Status (active, closed, etc.)
  location?: object,       // Optional location data
  amount?: string,         // Optional amount (for scholarships)
  specificCollection: string // Reference to detailed collection
}
```

### 2. Specific Collections (Full Data)

Individual collections store complete information for each opportunity type.

**Collections**:
- `scholarships` - Scholarship / Grant opportunities
- `competitions` - Competition / Event opportunities
- `workshops` - Workshop / Seminar opportunities
- `studySpots` - Study Spot locations
- `resources` - Learning resources

**Purpose**:
- Store complete, type-specific data
- Retrieved when user views full opportunity details
- Maintain data integrity and specificity

**Category-Specific Fields**:

#### Scholarships / Competitions
```javascript
{
  ...commonFields,
  amount: string,
  eligibility: string,
  dateMilestones: Array<{name: string, date: string}>
}
```

#### Workshops
```javascript
{
  ...commonFields,
  workshopStarts: string,
  workshopEnds: string,
  repeats: boolean,
  selectedDays: string[],
  location: {
    latitude: number,
    longitude: number,
    timestamp: number
  }
}
```

#### Study Spots
```javascript
{
  ...commonFields,
  openTime: string,
  closeTime: string,
  location: {
    latitude: number,
    longitude: number,
    timestamp: number
  }
}
```

#### Resources
```javascript
{
  ...commonFields,
  uploadedFile: {
    name: string,
    uri: string,
    size: number,
    mimeType: string
  }
}
```

## Implementation

### Creating an Opportunity

**Function**: `createOpportunity(opportunityData, category, organizationId)`

**Process**:
1. Determines the specific collection based on category
2. Creates a document in the specific collection with complete data
3. Creates a denormalized preview document in the `opportunities` collection
4. Both documents share the same ID for easy reference

**Usage Example**:
```javascript
import { createOpportunity } from '../services/firestoreService';

const opportunityData = {
  title: "Summer Research Grant",
  description: "Funding for undergraduate research",
  amount: "$5000",
  eligibility: "Undergraduate students",
  dateMilestones: [
    { name: "Application Deadline", date: "May 15, 2025" }
  ]
};

const opportunityId = await createOpportunity(
  opportunityData,
  "Scholarship / Grant",
  currentUser.uid
);
```

### Retrieving Opportunities

#### For List/Feed Views
Query the `opportunities` collection for fast, lightweight results:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'opportunities'),
  where('category', '==', 'Scholarship / Grant'),
  where('status', '==', 'active')
);
const querySnapshot = await getDocs(q);
```

#### For Detailed Views
Use the preview to determine the specific collection, then fetch full details:
```javascript
import { getOpportunityPreview, getOpportunityDetails } from '../services/firestoreService';

// First, get the preview to know which collection to query
const preview = await getOpportunityPreview(opportunityId);

// Then fetch the complete data
const fullDetails = await getOpportunityDetails(
  opportunityId,
  preview.specificCollection
);
```

### Updating Opportunities

**Function**: `updateOpportunity(opportunityId, specificCollection, updateData)`

**Process**:
- Updates the specific collection with all changes
- Updates relevant fields in the `opportunities` collection preview
- Maintains timestamp consistency

**Usage Example**:
```javascript
import { updateOpportunity } from '../services/firestoreService';

await updateOpportunity(
  opportunityId,
  'scholarships',
  {
    title: "Updated Title",
    amount: "$6000",
    status: "closed"
  }
);
```

## Benefits

### Performance
- **Fast Queries**: Preview collection contains only essential data
- **Reduced Costs**: Fewer bytes transferred for list views
- **Scalability**: Can handle large numbers of opportunities efficiently

### Flexibility
- **Type-Specific Fields**: Each category can have unique data structures
- **Easy Filtering**: Common fields in preview enable efficient queries
- **Data Integrity**: Complete data stored in appropriate collections

### User Experience
- **Quick Loading**: List views load instantly with preview data
- **Rich Details**: Full information available when needed
- **Smooth Navigation**: Seamless transition from list to detail view

## Category Mapping

The system automatically maps UI categories to database collections:

| UI Category | Collection Name |
|------------|----------------|
| Scholarship / Grant | scholarships |
| Competition / Event | competitions |
| Workshop / Seminar | workshops |
| Resources | resources |
| Study Spot | studySpots |

## File Structure

### Implementation Files
- `services/firestoreService.js` - Core database functions
- `app/orgPages/(tabs)/OrgCreate.tsx` - Opportunity creation UI

### Key Functions
- `createOpportunity()` - Create new opportunity (hybrid model)
- `getOpportunityPreview()` - Get preview data
- `getOpportunityDetails()` - Get full details
- `updateOpportunity()` - Update both collections

## Future Enhancements

Potential improvements to the system:
1. Add query functions with pagination
2. Implement search functionality across previews
3. Add caching layer for frequently accessed opportunities
4. Create batch operations for bulk updates
5. Add analytics tracking for popular opportunities
6. Implement soft delete with status field

## Best Practices

### When Creating Opportunities
- Always provide required fields (title, description)
- Include filtering fields (location, amount) when relevant
- Validate data before submission
- Handle errors gracefully

### When Querying
- Use preview collection for lists and searches
- Fetch full details only when user requests them
- Implement pagination for large result sets
- Cache results when appropriate

### When Updating
- Update both collections consistently
- Use the `updateOpportunity()` function to maintain sync
- Consider impact on preview data when updating fields
- Log changes for audit trail

## Testing

To test the hybrid system:

1. **Create Test**: Submit opportunities of different categories
2. **Read Test**: Query opportunities collection and verify previews
3. **Detail Test**: Fetch full details and confirm all fields present
4. **Update Test**: Modify opportunities and verify both collections update
5. **Performance Test**: Measure query times with large datasets

## Troubleshooting

### Common Issues

**Issue**: Preview and specific collection out of sync
- **Solution**: Use `updateOpportunity()` function for all updates

**Issue**: Missing fields in preview
- **Solution**: Check that essential fields are included in `createOpportunity()`

**Issue**: Slow queries
- **Solution**: Add indexes for frequently queried fields

**Issue**: Category mismatch
- **Solution**: Verify category mapping in `getCollectionNameForCategory()`



