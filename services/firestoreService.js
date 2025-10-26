import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebaseconfig";

// Function to add or update user profile
export const createUserProfile = async (userId, profileData) => {
  return setDoc(doc(db, "profiles", userId), profileData);
};

// Function to get user profile data
export const getUserProfile = async (userId) => {
  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId));
    if (profileDoc.exists()) {
      return profileDoc.data();
    } else {
      console.log("No profile document found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Function to get all community posts
export const getCommunityPosts = async () => {
  try {
    const postsCol = collection(db, "posts");
    const postsSnap = await getDocs(postsCol);
    return postsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        user: data.user,
        date: data.date,
        title: data.title,
        desc: data.desc,
        tag: data.tag,
        upvotes: data.upvotes ?? 0, // <-- ensure upvotes is always present
        upvotedBy: data.upvotedBy || [], // <-- ensure upvotedBy is always an array
      };
    });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    throw error;
  }
};

export const getLargestPosts = async () => {
  try {
    const postsCol = collection(db, "posts");
    const q = query(postsCol, orderBy("upvotes", "desc"));
    const postsSnap = await getDocs(q);
    return postsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        user: data.user,
        date: data.date,
        title: data.title,
        desc: data.desc,
        tag: data.tag,
        upvotes: data.upvotes ?? 0,
        upvotedBy: data.upvotedBy || [],
      };
    });
  } catch (error) {
    console.error("Error fetching largest posts:", error);
    throw error;
  }
};

// Function to add a new community post
export const addCommunityPost = async (postData) => {
  try {
    return await addDoc(collection(db, "posts"), postData);
  } catch (error) {
    console.error("Error adding community post:", error);
    throw error;
  }
};

// Function to update user profile data
export const updateUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, "profiles", userId), profileData, { merge: true });
    console.log("Profile updated successfully");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * HYBRID OPPORTUNITIES SYSTEM
 *
 * This system uses two parts:
 * 1. A denormalized 'opportunities' collection with preview data for lists/feeds
 * 2. Specific collections (scholarships, workshops, studySpots) with complete data
 */

// Map category names to collection names
const getCollectionNameForCategory = (category) => {
  const categoryMap = {
    "Scholarship / Grant": "scholarships",
    "Competition / Event": "competitions",
    "Workshop / Seminar": "workshops",
    Resources: "resources",
    "Study Spot": "studySpots",
  };
  return categoryMap[category] || "opportunities";
};

/**
 * Create an opportunity with the hybrid model
 * @param {Object} opportunityData - Complete opportunity data
 * @param {string} category - Category of the opportunity
 * @param {string} organizationId - ID of the organization creating the opportunity
 * @returns {Promise<string>} - The ID of the created opportunity
 */
export const createOpportunity = async (
  opportunityData,
  category,
  organizationId
) => {
  try {
    // Determine the specific collection based on category
    const specificCollection = getCollectionNameForCategory(category);

    // Add metadata
    const timestamp = serverTimestamp();
    const completeData = {
      ...opportunityData,
      category,
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "active",
    };

    // Step 1: Create the document in the specific collection (with full data)
    const specificDocRef = await addDoc(
      collection(db, specificCollection),
      completeData
    );
    const opportunityId = specificDocRef.id;

    // Step 2: Create a denormalized preview document in the 'opportunities' collection
    const previewData = {
      id: opportunityId,
      title: opportunityData.title,
      description: opportunityData.description,
      category,
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "active",
      // Include key filtering fields
      ...(opportunityData.location && { location: opportunityData.location }),
      ...(opportunityData.amount && { amount: opportunityData.amount }),
      // Add a reference to the specific collection
      specificCollection,
    };

    await setDoc(doc(db, "opportunities", opportunityId), previewData);

    console.log(`Opportunity created successfully with ID: ${opportunityId}`);
    return opportunityId;
  } catch (error) {
    console.error("Error creating opportunity:", error);
    throw error;
  }
};

/**
 * Get the full details of an opportunity from its specific collection
 * @param {string} opportunityId - ID of the opportunity
 * @param {string} specificCollection - Name of the specific collection
 * @returns {Promise<Object>} - Full opportunity data
 */
export const getOpportunityDetails = async (
  opportunityId,
  specificCollection
) => {
  try {
    const docRef = doc(db, specificCollection, opportunityId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No opportunity found with ID:", opportunityId);
      return null;
    }
  } catch (error) {
    console.error("Error getting opportunity details:", error);
    throw error;
  }
};

/**
 * Get opportunity preview from the opportunities collection
 * @param {string} opportunityId - ID of the opportunity
 * @returns {Promise<Object>} - Preview data
 */
export const getOpportunityPreview = async (opportunityId) => {
  try {
    const docRef = doc(db, "opportunities", opportunityId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No opportunity preview found with ID:", opportunityId);
      return null;
    }
  } catch (error) {
    console.error("Error getting opportunity preview:", error);
    throw error;
  }
};

/**
 * Update an opportunity in both collections
 * @param {string} opportunityId - ID of the opportunity
 * @param {string} specificCollection - Name of the specific collection
 * @param {Object} updateData - Data to update
 */
export const updateOpportunity = async (
  opportunityId,
  specificCollection,
  updateData
) => {
  try {
    const timestamp = serverTimestamp();
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: timestamp,
    };

    // Update in specific collection
    await setDoc(
      doc(db, specificCollection, opportunityId),
      dataWithTimestamp,
      { merge: true }
    );

    // Update preview data in opportunities collection
    const previewUpdateData = {
      updatedAt: timestamp,
      ...(updateData.title && { title: updateData.title }),
      ...(updateData.description && { description: updateData.description }),
      ...(updateData.location && { location: updateData.location }),
      ...(updateData.amount && { amount: updateData.amount }),
      ...(updateData.status && { status: updateData.status }),
    };

    await setDoc(doc(db, "opportunities", opportunityId), previewUpdateData, {
      merge: true,
    });

    console.log("Opportunity updated successfully");
  } catch (error) {
    console.error("Error updating opportunity:", error);
    throw error;
  }
};

/**
 * Get all opportunities for a specific organization
 * @param {string} organizationId - ID of the organization
 * @returns {Promise<Array>} - Array of opportunity previews
 */
export const getOrganizationOpportunities = async (organizationId) => {
  try {
    const { query, where, getDocs, collection, orderBy } = await import(
      "firebase/firestore"
    );

    const q = query(
      collection(db, "opportunities"),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const opportunities = [];

    querySnapshot.forEach((doc) => {
      opportunities.push({ id: doc.id, ...doc.data() });
    });

    return opportunities;
  } catch (error) {
    console.error("Error getting organization opportunities:", error);
    throw error;
  }
};

/**
 * Delete an opportunity from both collections
 * @param {string} opportunityId - ID of the opportunity
 * @param {string} specificCollection - Name of the specific collection
 */
export const deleteOpportunity = async (opportunityId, specificCollection) => {
  try {
    const { deleteDoc } = await import("firebase/firestore");

    // Delete from specific collection
    await deleteDoc(doc(db, specificCollection, opportunityId));

    // Delete from opportunities collection
    await deleteDoc(doc(db, "opportunities", opportunityId));

    console.log("Opportunity deleted successfully");
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    throw error;
  }
};

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

    querySnapshot.forEach((docSnap) => {
      opportunities.push({ id: docSnap.id, ...docSnap.data() });
    });

    const organizationIds = [
      ...new Set(
        opportunities
          .map((op) => op.organizationId)
          .filter((id) => typeof id === "string" && id.length)
      ),
    ];

    let profilesMap = new Map();
    if (organizationIds.length) {
      const profileEntries = await Promise.all(
        organizationIds.map(async (orgId) => {
          const profileSnap = await getDoc(doc(db, "profiles", orgId));
          return [orgId, profileSnap.exists() ? profileSnap.data() : null];
        })
      );
      profilesMap = new Map(profileEntries);
    }

    return opportunities.map((opportunity) => {
      const profile = profilesMap.get(opportunity.organizationId) || null;
      const profileName = profile?.name;

      return {
        ...opportunity,
        organizationProfile: profile
          ? { id: opportunity.organizationId, ...profile }
          : undefined,
        organizationName:
          profileName || opportunity.organizationName || "Organization",
        organizationVerificationStatus:
          profile?.verificationStatus ??
          opportunity.organizationVerificationStatus,
      };
    });
  } catch (error) {
    console.error("Error fetching active opportunities:", error);
    throw error;
  }
};

export async function updateCommunityPostUpvotes(postId, userId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  const post = postSnap.data();
  const hasUpvoted = post.upvotedBy?.includes(userId);

  if (hasUpvoted) {
    // Remove upvote
    await updateDoc(postRef, {
      upvotes: increment(-1),
      upvotedBy: arrayRemove(userId),
    });
  } else {
    // Add upvote
    await updateDoc(postRef, {
      upvotes: increment(1),
      upvotedBy: arrayUnion(userId),
    });
  }
}

/**
 * LIBRARY BOOKMARK MANAGEMENT
 * Manages student bookmarks for educational resources
 */

/**
 * Add a resource to user's bookmarks
 * @param {string} userId - Student user ID
 * @param {string} uploadId - Resource upload ID
 * @returns {Promise<void>}
 */
export const addBookmark = async (userId, uploadId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, {
      bookmarkedResources: arrayUnion(uploadId),
    });
    console.log("Bookmark added:", uploadId);
  } catch (error) {
    console.error("Error adding bookmark:", error);
    throw error;
  }
};

/**
 * Remove a resource from user's bookmarks
 * @param {string} userId - Student user ID
 * @param {string} uploadId - Resource upload ID
 * @returns {Promise<void>}
 */
export const removeBookmark = async (userId, uploadId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, {
      bookmarkedResources: arrayRemove(uploadId),
    });
    console.log("Bookmark removed:", uploadId);
  } catch (error) {
    console.error("Error removing bookmark:", error);
    throw error;
  }
};

/**
 * Get all bookmarked resources for a user
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} - Array of bookmarked upload documents
 */
export const getBookmarkedResources = async (userId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }

    const bookmarkedIds = userSnap.data().bookmarkedResources || [];
    
    if (bookmarkedIds.length === 0) {
      return [];
    }

    // Fetch each bookmarked resource
    const resourcePromises = bookmarkedIds.map(async (uploadId) => {
      try {
        const uploadRef = doc(db, "uploads", uploadId);
        const uploadSnap = await getDoc(uploadRef);
        
        if (uploadSnap.exists() && uploadSnap.data().status === "active") {
          return { id: uploadSnap.id, ...uploadSnap.data() };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching upload ${uploadId}:`, error);
        return null;
      }
    });

    const resources = await Promise.all(resourcePromises);
    
    // Filter out null values (deleted or inactive resources)
    return resources.filter((resource) => resource !== null);
  } catch (error) {
    console.error("Error getting bookmarked resources:", error);
    throw error;
  }
};

/**
 * Check if a resource is bookmarked by a user
 * @param {string} userId - Student user ID
 * @param {string} uploadId - Resource upload ID
 * @returns {Promise<boolean>}
 */
export const isResourceBookmarked = async (userId, uploadId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }

    const bookmarkedIds = userSnap.data().bookmarkedResources || [];
    return bookmarkedIds.includes(uploadId);
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    return false;
  }
};

/**
 * OPPORTUNITY BOOKMARK MANAGEMENT
 * Manages student bookmarks for opportunities (scholarships, competitions, etc.)
 */

/**
 * Add an opportunity to user's bookmarks
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @param {string} specificCollection - Collection name (scholarships, competitions, etc.)
 * @returns {Promise<void>}
 */
export const addOpportunityBookmark = async (userId, opportunityId, specificCollection) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error("User profile not found");
      return;
    }

    const bookmarkedOpportunities = userSnap.data().bookmarkedOpportunities || [];
    
    // Check if already bookmarked
    const alreadyBookmarked = bookmarkedOpportunities.some(
      (bookmark) => bookmark.opportunityId === opportunityId && bookmark.specificCollection === specificCollection
    );
    
    if (alreadyBookmarked) {
      console.log("Opportunity already bookmarked:", opportunityId);
      return;
    }
    
    // Add new bookmark
    const bookmarkData = {
      opportunityId,
      specificCollection,
      bookmarkedAt: new Date(),
    };
    
    await updateDoc(userRef, {
      bookmarkedOpportunities: [...bookmarkedOpportunities, bookmarkData],
    });
    console.log("✅ Opportunity bookmark added:", opportunityId);
  } catch (error) {
    console.error("Error adding opportunity bookmark:", error);
    throw error;
  }
};

/**
 * Remove an opportunity from user's bookmarks
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @param {string} specificCollection - Collection name
 * @returns {Promise<void>}
 */
export const removeOpportunityBookmark = async (userId, opportunityId, specificCollection) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return;
    }

    const bookmarkedOpportunities = userSnap.data().bookmarkedOpportunities || [];
    const updatedBookmarks = bookmarkedOpportunities.filter(
      (bookmark) => !(bookmark.opportunityId === opportunityId && bookmark.specificCollection === specificCollection)
    );
    
    await updateDoc(userRef, {
      bookmarkedOpportunities: updatedBookmarks,
    });
    console.log("❌ Opportunity bookmark removed:", opportunityId);
  } catch (error) {
    console.error("Error removing opportunity bookmark:", error);
    throw error;
  }
};

/**
 * Get all bookmarked opportunities for a user
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} - Array of bookmarked opportunity documents
 */
export const getBookmarkedOpportunities = async (userId) => {
  try {
    console.log("🔖 Fetching bookmarked opportunities for user:", userId);
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log("⚠️ User profile not found");
      return [];
    }

    const bookmarkedOpportunities = userSnap.data().bookmarkedOpportunities || [];
    console.log(`📋 Found ${bookmarkedOpportunities.length} bookmarked opportunities in profile`);
    
    if (bookmarkedOpportunities.length === 0) {
      return [];
    }

    // Fetch each bookmarked opportunity
    const opportunityPromises = bookmarkedOpportunities.map(async (bookmark, index) => {
      try {
        console.log(`  📌 Fetching bookmark ${index + 1}:`, bookmark.opportunityId, "from", bookmark.specificCollection);
        const oppRef = doc(db, bookmark.specificCollection, bookmark.opportunityId);
        const oppSnap = await getDoc(oppRef);
        
        if (!oppSnap.exists()) {
          console.log(`    ⚠️ Opportunity not found: ${bookmark.opportunityId}`);
          return null;
        }
        
        const oppData = oppSnap.data();
        console.log(`    ✅ Found opportunity: ${oppData.title}, status: ${oppData.status}`);
        
        if (oppData.status === "active") {
          return { 
            id: oppSnap.id, 
            specificCollection: bookmark.specificCollection,
            ...oppData 
          };
        }
        
        console.log(`    ⏭️ Skipped (status is not active)`);
        return null;
      } catch (error) {
        console.error(`    ❌ Error fetching opportunity ${bookmark.opportunityId}:`, error);
        return null;
      }
    });

    const opportunities = await Promise.all(opportunityPromises);
    
    // Filter out null values (deleted or inactive opportunities)
    const activeOpportunities = opportunities.filter((opportunity) => opportunity !== null);
    console.log(`✅ Returning ${activeOpportunities.length} active bookmarked opportunities`);
    
    return activeOpportunities;
  } catch (error) {
    console.error("Error getting bookmarked opportunities:", error);
    throw error;
  }
};

/**
 * Check if an opportunity is bookmarked by a user
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @param {string} specificCollection - Collection name
 * @returns {Promise<boolean>}
 */
export const isOpportunityBookmarked = async (userId, opportunityId, specificCollection) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }

    const bookmarkedOpportunities = userSnap.data().bookmarkedOpportunities || [];
    return bookmarkedOpportunities.some(
      (bookmark) => bookmark.opportunityId === opportunityId && bookmark.specificCollection === specificCollection
    );
  } catch (error) {
    console.error("Error checking opportunity bookmark status:", error);
    return false;
  }
};

/**
 * REGISTERED OPPORTUNITIES MANAGEMENT
 * Manages student registrations to opportunities with deadline tracking
 */

/**
 * Register a student to an opportunity
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @param {string} specificCollection - Collection where the opportunity is stored
 * @returns {Promise<void>}
 */
export const registerToOpportunity = async (userId, opportunityId, specificCollection) => {
  try {
    // Create a registration record
    // Note: Use Timestamp.now() instead of serverTimestamp() because
    // serverTimestamp() cannot be used inside arrayUnion()
    const registrationData = {
      opportunityId,
      specificCollection,
      registeredAt: Timestamp.now(),
    };

    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, {
      registeredOpportunities: arrayUnion(registrationData),
    });
    
    // Create initial deadline snapshot for change detection
    await saveDeadlineSnapshot(userId, opportunityId, specificCollection);
    
    console.log("Registered to opportunity:", opportunityId);
  } catch (error) {
    console.error("Error registering to opportunity:", error);
    throw error;
  }
};

/**
 * Unregister a student from an opportunity
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @returns {Promise<void>}
 */
export const unregisterFromOpportunity = async (userId, opportunityId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return;
    }

    const registrations = userSnap.data().registeredOpportunities || [];
    const updatedRegistrations = registrations.filter(
      (reg) => reg.opportunityId !== opportunityId
    );

    await updateDoc(userRef, {
      registeredOpportunities: updatedRegistrations,
    });
    console.log("Unregistered from opportunity:", opportunityId);
  } catch (error) {
    console.error("Error unregistering from opportunity:", error);
    throw error;
  }
};

/**
 * Get all registered opportunities for a user with their full details
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} - Array of registered opportunity details with date milestones
 */
export const getRegisteredOpportunities = async (userId) => {
  try {
    console.log("🔍 getRegisteredOpportunities called for user:", userId);
    
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log("⚠️ User profile not found");
      return [];
    }

    const registrations = userSnap.data().registeredOpportunities || [];
    console.log("📝 Registrations in profile:", registrations.length);
    
    if (registrations.length === 0) {
      console.log("⚠️ No registeredOpportunities array or it's empty");
      return [];
    }

    // Fetch each registered opportunity with full details
    const opportunityPromises = registrations.map(async (registration, idx) => {
      try {
        const { opportunityId, specificCollection, registeredAt } = registration;
        console.log(`  📄 Fetching registration ${idx + 1}: ${opportunityId} from ${specificCollection}`);
        
        // Fetch from specific collection for full details
        const oppRef = doc(db, specificCollection, opportunityId);
        const oppSnap = await getDoc(oppRef);
        
        if (!oppSnap.exists()) {
          console.log(`    ❌ Opportunity not found in ${specificCollection}`);
          return null;
        }
        
        const oppData = oppSnap.data();
        if (oppData.status !== "active") {
          console.log(`    ⏸️ Opportunity status is "${oppData.status}" (not active)`);
          return null;
        }
        
        console.log(`    ✅ Opportunity loaded: ${oppData.title}`);
        return {
          id: oppSnap.id,
          ...oppData,
          specificCollection,
          registeredAt,
        };
      } catch (error) {
        console.error(`    ❌ Error fetching opportunity ${registration.opportunityId}:`, error);
        return null;
      }
    });

    const opportunities = await Promise.all(opportunityPromises);
    
    // Filter out null values (deleted or inactive opportunities)
    const activeOpportunities = opportunities.filter((opp) => opp !== null);
    console.log("✅ Active opportunities found:", activeOpportunities.length);
    
    return activeOpportunities;
  } catch (error) {
    console.error("❌ Error getting registered opportunities:", error);
    throw error;
  }
};

/**
 * Check if a user is registered to an opportunity
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @returns {Promise<boolean>}
 */
export const isRegisteredToOpportunity = async (userId, opportunityId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }

    const registrations = userSnap.data().registeredOpportunities || [];
    return registrations.some((reg) => reg.opportunityId === opportunityId);
  } catch (error) {
    console.error("Error checking registration status:", error);
    return false;
  }
};

/**
 * Parse various date formats into a valid Date object
 * @param {*} dateValue - Date in various formats
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
const parseFlexibleDate = (dateValue) => {
  if (!dateValue) return null;
  
  // Already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    try {
      return dateValue.toDate();
    } catch (e) {
      return null;
    }
  }
  
  // Unix timestamp (number)
  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // String parsing
  if (typeof dateValue === 'string') {
    // Try standard Date constructor first
    let date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Handle "Nov 18, 2025" or "November 18, 2025" format
    const monthNames = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };
    
    // Match "Month DD, YYYY" format
    const match = dateValue.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
    if (match) {
      const [, monthStr, day, year] = match;
      const month = monthNames[monthStr.toLowerCase()];
      
      if (month !== undefined) {
        date = new Date(parseInt(year), month, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Try ISO format "YYYY-MM-DD"
    const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
};

/**
 * Get upcoming deadlines from registered opportunities
 * @param {string} userId - Student user ID
 * @param {number} limit - Maximum number of deadlines to return
 * @returns {Promise<Array>} - Array of upcoming deadlines sorted by urgency
 */
export const getUpcomingDeadlines = async (userId, limit = 10) => {
  try {
    console.log("🔍 getUpcomingDeadlines called for user:", userId);
    
    const registeredOpportunities = await getRegisteredOpportunities(userId);
    console.log("📦 Registered opportunities count:", registeredOpportunities.length);
    
    if (registeredOpportunities.length === 0) {
      console.log("⚠️ No registered opportunities found for this user");
      return [];
    }
    
    const deadlines = [];
    const now = new Date();
    console.log("📅 Current date (for comparison):", now.toISOString());

    registeredOpportunities.forEach((opportunity, index) => {
      console.log(`\n🔎 Processing opportunity ${index + 1}:`, opportunity.title);
      console.log("  ID:", opportunity.id);
      console.log("  Collection:", opportunity.specificCollection);
      console.log("  Has dateMilestones:", !!opportunity.dateMilestones);
      console.log("  Has deadline field:", !!opportunity.deadline);
      
      // Extract date milestones from the opportunity
      if (opportunity.dateMilestones && Array.isArray(opportunity.dateMilestones)) {
        console.log("  📋 dateMilestones count:", opportunity.dateMilestones.length);
        
        opportunity.dateMilestones.forEach((milestone, idx) => {
          console.log(`    Milestone ${idx + 1} RAW DATA:`, JSON.stringify(milestone, null, 2));
          
          // Validate milestone structure
          if (!milestone || !milestone.date) {
            console.log(`      ⚠️ Skipped: Invalid milestone structure (missing date)`);
            return;
          }
          
          // Use the flexible date parser
          const milestoneDate = parseFlexibleDate(milestone.date);
          
          if (!milestoneDate) {
            console.log(`      ⚠️ Skipped: Could not parse date "${milestone.date}"`);
            return;
          }
          
          const isFuture = milestoneDate > now;
          // Support multiple field names: description, title, name, label
          const milestoneTitle = milestone.description || milestone.title || milestone.name || milestone.label || "Deadline";
          
          console.log(`    Milestone ${idx + 1}:`, milestoneTitle);
          console.log(`      Parsed date:`, milestoneDate.toISOString());
          console.log(`      Is future?`, isFuture);
          
          // Only include future deadlines
          if (isFuture) {
            deadlines.push({
              date: milestoneDate,
              title: opportunity.title,
              milestoneDescription: milestoneTitle,
              opportunityId: opportunity.id,
              specificCollection: opportunity.specificCollection,
              category: opportunity.category,
            });
            console.log(`      ✅ Added to deadlines list`);
          } else {
            console.log(`      ⏭️ Skipped (past date)`);
          }
        });
      } else {
        console.log("  ⚠️ No dateMilestones array found");
      }
      
      // Also check for a single deadline field
      if (opportunity.deadline) {
        console.log("  📅 Single deadline field found");
        console.log("    RAW deadline data:", JSON.stringify(opportunity.deadline));
        
        const deadlineDate = parseFlexibleDate(opportunity.deadline);
        
        if (!deadlineDate) {
          console.log("    ⚠️ Skipped: Could not parse deadline date");
        } else {
          const isFuture = deadlineDate > now;
          console.log("    Parsed date:", deadlineDate.toISOString());
          console.log("    Is future?", isFuture);
          
          if (isFuture) {
            deadlines.push({
              date: deadlineDate,
              title: opportunity.title,
              milestoneDescription: "Final Deadline",
              opportunityId: opportunity.id,
              specificCollection: opportunity.specificCollection,
              category: opportunity.category,
            });
            console.log("    ✅ Added to deadlines list");
          } else {
            console.log("    ⏭️ Skipped (past date)");
          }
        }
      }
    });

    console.log("\n📊 Total deadlines before sorting:", deadlines.length);
    
    // Sort by date (most urgent first)
    deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Limit the number of results
    const limitedDeadlines = deadlines.slice(0, limit);
    console.log("📊 Total deadlines after limit:", limitedDeadlines.length);
    
    return limitedDeadlines;
  } catch (error) {
    console.error("❌ Error getting upcoming deadlines:", error);
    return [];
  }
};

/**
 * DEADLINE CHANGE DETECTION SYSTEM
 * Tracks changes to opportunity deadlines and notifies students
 */

/**
 * Helper: Extract deadlines from an opportunity
 * @param {Object} opportunity - Opportunity object
 * @returns {Array} - Array of deadline objects with dates and descriptions
 */
const extractDeadlinesFromOpportunity = (opportunity) => {
  const deadlines = [];
  
  // Extract from dateMilestones array
  if (opportunity.dateMilestones && Array.isArray(opportunity.dateMilestones)) {
    opportunity.dateMilestones.forEach((milestone) => {
      if (milestone.date) {
        deadlines.push({
          description: milestone.description || milestone.title || "Deadline",
          date: milestone.date.toDate ? milestone.date.toDate().getTime() : new Date(milestone.date).getTime(),
        });
      }
    });
  }
  
  // Extract from single deadline field
  if (opportunity.deadline) {
    const deadlineDate = opportunity.deadline.toDate 
      ? opportunity.deadline.toDate() 
      : new Date(opportunity.deadline);
    deadlines.push({
      description: "Final Deadline",
      date: deadlineDate.getTime(),
    });
  }
  
  return deadlines;
};

/**
 * Save deadline snapshot when student first registers
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @param {string} specificCollection - Collection where the opportunity is stored
 * @returns {Promise<void>}
 */
export const saveDeadlineSnapshot = async (userId, opportunityId, specificCollection) => {
  try {
    // Fetch the opportunity to get its current deadlines
    const oppRef = doc(db, specificCollection, opportunityId);
    const oppSnap = await getDoc(oppRef);
    
    if (!oppSnap.exists()) {
      console.log("Opportunity not found for snapshot:", opportunityId);
      return;
    }
    
    const opportunity = oppSnap.data();
    const deadlines = extractDeadlinesFromOpportunity(opportunity);
    
    // Create snapshot object
    const snapshot = {
      opportunityId,
      specificCollection,
      deadlines,
      lastChecked: Timestamp.now(),
    };
    
    // Save to user profile
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const snapshots = userSnap.data().deadlineSnapshots || {};
      snapshots[opportunityId] = snapshot;
      
      await updateDoc(userRef, {
        deadlineSnapshots: snapshots,
      });
      
      console.log("📸 Deadline snapshot saved for:", opportunityId);
    }
  } catch (error) {
    console.error("Error saving deadline snapshot:", error);
    // Don't throw - snapshots are optional, don't break registration
  }
};

/**
 * Check for deadline changes in a specific opportunity
 * @param {string} userId - Student user ID
 * @param {string} opportunityId - Opportunity ID
 * @param {string} specificCollection - Collection name
 * @returns {Promise<Array>} - Array of detected changes
 */
export const checkOpportunityDeadlineChanges = async (userId, opportunityId, specificCollection) => {
  try {
    // Get stored snapshot
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }
    
    const snapshots = userSnap.data().deadlineSnapshots || {};
    const snapshot = snapshots[opportunityId];
    
    if (!snapshot) {
      console.log("No snapshot found for opportunity:", opportunityId);
      return [];
    }
    
    // Fetch current opportunity data
    const oppRef = doc(db, specificCollection, opportunityId);
    const oppSnap = await getDoc(oppRef);
    
    if (!oppSnap.exists()) {
      console.log("Opportunity no longer exists:", opportunityId);
      return [];
    }
    
    const opportunity = oppSnap.data();
    const currentDeadlines = extractDeadlinesFromOpportunity(opportunity);
    
    // Compare deadlines
    const changes = [];
    const oldDeadlinesMap = new Map(
      snapshot.deadlines.map(d => [d.description, d.date])
    );
    const currentDeadlinesMap = new Map(
      currentDeadlines.map(d => [d.description, d.date])
    );
    
    // Check for changed or removed deadlines
    oldDeadlinesMap.forEach((oldDate, description) => {
      const newDate = currentDeadlinesMap.get(description);
      
      if (!newDate) {
        // Deadline was removed
        changes.push({
          type: 'removed',
          description,
          oldDate,
          newDate: null,
        });
      } else if (oldDate !== newDate) {
        // Deadline date changed
        changes.push({
          type: 'changed',
          description,
          oldDate,
          newDate,
        });
      }
    });
    
    // Check for new deadlines
    currentDeadlinesMap.forEach((newDate, description) => {
      if (!oldDeadlinesMap.has(description)) {
        changes.push({
          type: 'added',
          description,
          oldDate: null,
          newDate,
        });
      }
    });
    
    // Always update lastChecked timestamp and snapshot
    snapshots[opportunityId] = {
      ...snapshot,
      deadlines: currentDeadlines,
      lastChecked: Timestamp.now(),
    };
    
    await updateDoc(userRef, {
      deadlineSnapshots: snapshots,
    });
    
    if (changes.length > 0) {
      console.log(`🔔 Detected ${changes.length} deadline change(s) for ${opportunityId}`);
    } else {
      console.log(`✓ No changes detected for ${opportunityId}`);
    }
    
    return changes;
  } catch (error) {
    console.error("Error checking deadline changes:", error);
    return [];
  }
};

/**
 * Check for deadline changes across all registered opportunities
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} - Array of all detected changes with opportunity details
 */
export const checkAllDeadlineChanges = async (userId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }
    
    const registrations = userSnap.data().registeredOpportunities || [];
    const allChanges = [];
    
    // Check each registered opportunity
    for (const registration of registrations) {
      const { opportunityId, specificCollection } = registration;
      
      const changes = await checkOpportunityDeadlineChanges(
        userId, 
        opportunityId, 
        specificCollection
      );
      
      if (changes.length > 0) {
        // Fetch opportunity details for the changes
        const oppRef = doc(db, specificCollection, opportunityId);
        const oppSnap = await getDoc(oppRef);
        
        if (oppSnap.exists()) {
          const opportunity = oppSnap.data();
          
          allChanges.push({
            opportunityId,
            opportunityTitle: opportunity.title,
            category: opportunity.category,
            specificCollection,
            changes,
          });
        }
      }
    }
    
    return allChanges;
  } catch (error) {
    console.error("Error checking all deadline changes:", error);
    return [];
  }
};

/**
 * Create a notification for deadline changes
 * @param {string} userId - Student user ID
 * @param {Object} changeData - Change data object
 * @returns {Promise<void>}
 */
export const createDeadlineChangeNotification = async (userId, changeData) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return;
    }
    
    // Check if an unread notification already exists for this opportunity
    const existingNotifications = userSnap.data().deadlineNotifications || [];
    const hasUnreadNotification = existingNotifications.some(
      notif => notif.opportunityId === changeData.opportunityId && !notif.read
    );
    
    if (hasUnreadNotification) {
      console.log("⏭️ Skipping notification - unread notification already exists for:", changeData.opportunityTitle);
      return;
    }
    
    // Create new notification
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'deadline_change',
      opportunityId: changeData.opportunityId,
      opportunityTitle: changeData.opportunityTitle,
      category: changeData.category,
      changes: changeData.changes,
      read: false,
      createdAt: Timestamp.now(),
    };
    
    await updateDoc(userRef, {
      deadlineNotifications: arrayUnion(notification),
    });
    
    console.log("🔔 Notification created for deadline changes:", changeData.opportunityTitle);
  } catch (error) {
    console.error("Error creating deadline notification:", error);
    throw error;
  }
};

/**
 * Get unread deadline change notifications
 * @param {string} userId - Student user ID
 * @returns {Promise<Array>} - Array of unread notifications
 */
export const getUnreadDeadlineNotifications = async (userId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }
    
    const notifications = userSnap.data().deadlineNotifications || [];
    return notifications.filter(notif => !notif.read);
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 * @param {string} userId - Student user ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return;
    }
    
    const notifications = userSnap.data().deadlineNotifications || [];
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    
    await updateDoc(userRef, {
      deadlineNotifications: updatedNotifications,
    });
    
    console.log("✓ Notification marked as read:", notificationId);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Sync tracked opportunity deadlines (called periodically or on focus)
 * @param {string} userId - Student user ID
 * @returns {Promise<number>} - Number of changes detected
 */
export const syncTrackedOpportunityDeadlines = async (userId) => {
  try {
    console.log("🔄 Syncing tracked opportunity deadlines...");
    
    const allChanges = await checkAllDeadlineChanges(userId);
    
    if (allChanges.length > 0) {
      // Create notifications for each opportunity with changes
      for (const changeData of allChanges) {
        await createDeadlineChangeNotification(userId, changeData);
      }
      
      console.log(`✓ Found and notified about ${allChanges.length} opportunities with deadline changes`);
      return allChanges.length;
    } else {
      console.log("✓ No deadline changes detected");
      return 0;
    }
  } catch (error) {
    console.error("Error syncing deadline changes:", error);
    return 0;
  }
};