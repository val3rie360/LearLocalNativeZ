<!-- ad356e47-df18-4b23-af59-bfe7f63b6f3d defd1ca1-5151-476d-bffd-f3d7b3207c56 -->
# Deploy Opportunities to Student Home Feed

## Overview

Replace static opportunity data in student home feed with live opportunities from Firestore. Display all active opportunities posted by organizations, sorted by latest first, with pull-to-refresh capability and navigation to detailed view page.

## Implementation Steps

### 1. Add Firestore Service Function

**File:** `services/firestoreService.js`

Add new function to fetch all active opportunities:

```javascript
/**
 * Get all active opportunities for students (all organizations)
 * @returns {Promise<Array>} - Array of active opportunities sorted by latest first
 */
export const getAllActiveOpportunities = async () => {
  try {
    const q = query(
      collection(db, "opportunities"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const opportunities = [];

    querySnapshot.forEach((doc) => {
      opportunities.push({ id: doc.id, ...doc.data() });
    });

    return opportunities;
  } catch (error) {
    console.error("Error fetching active opportunities:", error);
    throw error;
  }
};
```

Add after the existing `getOrganizationOpportunities` function around line 312.

### 2. Update Firestore Index

**File:** `firestore.indexes.json`

Add new index for querying active opportunities:

```json
{
  "collectionGroup": "opportunities",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```

Insert after the first index (after line 16).

Deploy index using:

```bash
firebase deploy --only firestore:indexes
```

### 3. Update Student Home Feed

**File:** `app/studentPages/(tabs)/Home.tsx`

Replace static OPPORTUNITIES constant with dynamic data:

**a) Add imports:**

```typescript
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { getAllActiveOpportunities } from "../../../services/firestoreService";
```

**b) Add state management (after line 86):**

```typescript
const [opportunities, setOpportunities] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

**c) Add fetch function:**

```typescript
const fetchOpportunities = async () => {
  try {
    setLoading(true);
    const data = await getAllActiveOpportunities();
    setOpportunities(data);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    setOpportunities([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

useEffect(() => {
  fetchOpportunities();
}, []);

const onRefresh = () => {
  setRefreshing(true);
  fetchOpportunities();
};
```

**d) Update ScrollView with RefreshControl (line 101):**

```typescript
<ScrollView 
  className="bg-[#E0E3FF] flex-1"
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
```

**e) Update Opportunities section (replace lines 168-179):**

```typescript
<LinearGradient
  colors={["#fff", "#DADEFF"]}
  style={{ padding: 25, marginTop: 20 }}
>
  <Text className="text-[20px] font-karla-bold mb-3">
    Opportunities
  </Text>
  {loading ? (
    <View className="py-8 items-center">
      <ActivityIndicator size="large" color="#4B1EB4" />
      <Text className="text-[#666] mt-2 font-karla">Loading opportunities...</Text>
    </View>
  ) : opportunities.length > 0 ? (
    opportunities.map((op) => (
      <OpportunityCard 
        key={op.id} 
        {...op}
        onViewDetails={() => router.push(`/studentPages/opportunity?id=${op.id}`)}
      />
    ))
  ) : (
    <View className="py-8 items-center">
      <Text className="text-[#666] font-karla">No opportunities available</Text>
    </View>
  )}
</LinearGradient>
```

**f) Remove static OPPORTUNITIES constant (line 40-52).**

### 4. Transform Opportunity Details Page

**File:** `app/studentPages/opportunity.tsx`

Replace static data with dynamic loading based on URL parameter:

**a) Add imports:**

```typescript
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { getOpportunityDetails } from "../../services/firestoreService";
```

**b) Add state and data fetching:**

```typescript
const Opportunity = () => {
  const { id, specificCollection } = useLocalSearchParams<{
    id: string;
    specificCollection: string;
  }>();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id || !specificCollection) return;
      
      try {
        setLoading(true);
        const data = await getOpportunityDetails(id, specificCollection);
        setOpportunity(data);
      } catch (err: any) {
        console.error("Error fetching opportunity:", err);
        setError(err.message || "Failed to load opportunity");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE] items-center justify-center">
        <ActivityIndicator size="large" color="#4B1EB4" />
        <Text className="text-[#666] mt-4 font-karla">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !opportunity) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE] items-center justify-center px-8">
        <Text className="text-[#666] text-center font-karla">{error || "Opportunity not found"}</Text>
      </SafeAreaView>
    );
  }

  // Rest of component uses opportunity data...
```

**c) Replace hardcoded values with dynamic data:**

- Title: `opportunity.title`
- Posted by: `opportunity.organizationName || "Organization"`
- Date: Format `opportunity.dateMilestones` or `opportunity.createdAt`
- Location: `opportunity.location?.address || opportunity.studySpotLocation`
- Amount: `opportunity.amount`
- Description: `opportunity.description`
- Eligibility: `opportunity.eligibility`

### 5. Update OpportunityCard Navigation

**File:** `app/studentPages/(tabs)/Home.tsx`

Pass correct parameters to opportunity details:

```typescript
<OpportunityCard 
  key={op.id}
  title={op.title}
  postedBy={op.organizationName || "Organization"}
  deadline={formatDate(op.createdAt)}
  amount={op.amount || "N/A"}
  eligibility={op.eligibility || "See details"}
  description={op.description}
  tag={op.category}
  onViewDetails={() => router.push({
    pathname: "/studentPages/opportunity",
    params: { 
      id: op.id, 
      specificCollection: op.specificCollection 
    }
  })}
/>
```

### 6. Add Date Formatting Helper

**File:** `app/studentPages/(tabs)/Home.tsx`

Add helper function for date formatting:

```typescript
const formatDate = (timestamp: any) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};
```

## Testing Checklist

1. Verify opportunities appear in student home feed
2. Test pull-to-refresh functionality
3. Confirm sorting (newest first)
4. Test navigation to details page
5. Verify all opportunity types display correctly
6. Test with zero opportunities
7. Test loading and error states
8. Deploy Firestore index and wait for completion

## Notes

- Organizations must include `organizationName` field when creating opportunities for proper display
- The hybrid model (preview + full data) is already in place
- Pull-to-refresh provides real-time updates without app restart
- Error handling ensures graceful degradation if Firestore is unavailable

### To-dos

- [ ] Add getAllActiveOpportunities function to firestoreService.js
- [ ] Add new Firestore index for status + createdAt query
- [ ] Replace static data with dynamic opportunities in Home.tsx
- [ ] Make opportunity.tsx dynamic with URL parameters
- [ ] Test all functionality and deploy Firestore index