import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { cloudinaryConfig, getUploadUrl } from "../cloudinaryConfig";
import { db } from "../firebaseconfig";

// Max file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validate PDF file before upload
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  // Check file type - PDF only
  const fileType = file.type || file.mimeType;
  if (fileType !== "application/pdf") {
    return {
      valid: false,
      error: "Invalid file type. Only PDF files are allowed",
    };
  }

  // Check file size (50MB)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File too large. Maximum size is 50MB",
    };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Generate unique file ID
 */
const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Upload PDF to Cloudinary
 * @param {Object} file - File object from document picker
 * @param {string} organizationId - Firebase organization ID
 * @param {Object} metadata - File metadata (displayName, description, category, tags)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} - Returns upload ID
 */
export const uploadPDF = async (file, organizationId, metadata, onProgress) => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique ID for Firestore document
    const uploadId = generateId();

    // Create FormData for Cloudinary
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType || "application/pdf",
      name: file.name,
    });

    // Always use the public PDF preset for PDFs
    formData.append("upload_preset", "learn_local_uploads");
    formData.append("cloud_name", cloudinaryConfig.cloudName);
    formData.append("folder", `uploads/${organizationId}`);

    formData.append(
      "public_id",
      `${uploadId}_${file.name.replace(".pdf", "")}`
    );

    // Add custom metadata tags
    if (metadata.tags && metadata.tags.length > 0) {
      formData.append("tags", metadata.tags.join(","));
    }

    // Upload to Cloudinary
    const cloudinaryUrl = getUploadUrl();

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);

            // Save metadata to Firestore
            const uploadDoc = {
              id: uploadId,
              organizationId: organizationId,
              fileName: file.name,
              displayName: metadata.displayName || file.name,
              description: metadata.description || "",
              fileType: "application/pdf",
              fileSize: file.size,
              cloudinaryPublicId: response.public_id,
              cloudinarySecureUrl: response.secure_url,
              cloudinaryUrl: response.url,
              cloudinaryResourceType: response.resource_type,
              category: metadata.category || "Uncategorized",
              tags: metadata.tags || [],
              downloadCount: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              status: "active",
            };

            await setDoc(doc(db, "uploads", uploadId), uploadDoc);

            console.log("Upload completed successfully:", uploadId);
            resolve(uploadId);
          } catch (error) {
            console.error("Error saving metadata:", error);
            reject(error);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", cloudinaryUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Get all uploads for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} - Array of upload documents
 */
export const getOrganizationUploads = async (organizationId) => {
  try {
    console.log("📂 Querying uploads collection...");
    console.log("   organizationId:", organizationId);

    // Query matching the Firebase index: organizationId + status + createdAt
    const q = query(
      collection(db, "uploads"),
      where("organizationId", "==", organizationId),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    console.log("📊 Query returned", querySnapshot.size, "documents");

    const uploads = [];

    querySnapshot.forEach((doc) => {
      uploads.push({ id: doc.id, ...doc.data() });
    });

    console.log("✅ Active uploads:", uploads.length);

    return uploads;
  } catch (error) {
    console.error("❌ Error fetching uploads:", error);
    console.log("💡 Index ID needed: Check if index CICAgJiUpoMK is enabled");
    throw error;
  }
};

/**
 * Get single upload by ID
 * @param {string} uploadId - Upload ID
 * @returns {Promise<Object>} - Upload document
 */
export const getUploadById = async (uploadId) => {
  try {
    const docRef = doc(db, "uploads", uploadId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Upload not found");
    }
  } catch (error) {
    console.error("Error fetching upload:", error);
    throw error;
  }
};

/**
 * Get file download URL
 * @param {Object} upload - Upload document from Firestore
 * @returns {string} - Cloudinary secure URL
 */
export const getFileUrl = (upload) => {
  return upload.cloudinarySecureUrl || upload.cloudinaryUrl;
};

/**
 * Get download URL by upload ID
 * @param {string} uploadId - Upload ID
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export const getDownloadUrl = async (uploadId) => {
  try {
    const upload = await getUploadById(uploadId);
    return getFileUrl(upload);
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};

/**
 * Update upload metadata
 * @param {string} uploadId - Upload ID
 * @param {Object} metadata - Updated metadata
 * @returns {Promise<void>}
 */
export const updateUploadMetadata = async (uploadId, metadata) => {
  try {
    const updateData = {
      ...metadata,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "uploads", uploadId), updateData);
    console.log("Upload metadata updated:", uploadId);
  } catch (error) {
    console.error("Error updating upload:", error);
    throw error;
  }
};

/**
 * Delete upload from Cloudinary and Firestore
 * @param {string} uploadId - Upload ID
 * @param {string} cloudinaryPublicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export const deleteUpload = async (uploadId, cloudinaryPublicId) => {
  try {
    // Note: Deleting from Cloudinary requires server-side API call with API secret
    // For now, we'll just delete from Firestore
    // Implement server-side deletion endpoint for production

    // Delete from Firestore
    await deleteDoc(doc(db, "uploads", uploadId));
    console.log("Upload deleted from Firestore:", uploadId);

    // TODO: Call your backend to delete from Cloudinary
    // DELETE https://api.cloudinary.com/v1_1/{cloud_name}/resources/{resource_type}/upload
  } catch (error) {
    console.error("Error deleting upload:", error);
    throw error;
  }
};

/**
 * Increment download count
 * @param {string} uploadId - Upload ID
 */
export const incrementDownloadCount = async (uploadId) => {
  try {
    await updateDoc(doc(db, "uploads", uploadId), {
      downloadCount: increment(1),
      lastDownloadedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error incrementing download count:", error);
  }
};

/**
 * Archive upload (soft delete)
 * @param {string} uploadId - Upload ID
 */
export const archiveUpload = async (uploadId) => {
  try {
    await updateDoc(doc(db, "uploads", uploadId), {
      status: "archived",
      archivedAt: serverTimestamp(),
    });
    console.log("Upload archived:", uploadId);
  } catch (error) {
    console.error("Error archiving upload:", error);
    throw error;
  }
};

/**
 * Search uploads by text
 * @param {string} searchText - Search query
 * @param {string} organizationId - Optional filter by organization
 * @returns {Promise<Array>} - Matching uploads
 */
export const searchUploads = async (searchText, organizationId = null) => {
  try {
    let q;

    if (organizationId) {
      q = query(
        collection(db, "uploads"),
        where("organizationId", "==", organizationId),
        where("status", "==", "active")
      );
    } else {
      q = query(collection(db, "uploads"), where("status", "==", "active"));
    }

    const querySnapshot = await getDocs(q);
    const uploads = [];

    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };

      // Client-side search
      const searchLower = searchText.toLowerCase();
      const titleMatch = data.displayName?.toLowerCase().includes(searchLower);
      const descMatch = data.description?.toLowerCase().includes(searchLower);
      const tagMatch = data.tags?.some((tag) =>
        tag.toLowerCase().includes(searchLower)
      );

      if (titleMatch || descMatch || tagMatch) {
        uploads.push(data);
      }
    });

    return uploads;
  } catch (error) {
    console.error("Error searching uploads:", error);
    throw error;
  }
};

/**
 * Get uploads by category
 * @param {string} category - Category name
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} - Array of uploads
 */
export const getUploadsByCategory = async (category, limit = 20) => {
  try {
    const q = query(
      collection(db, "uploads"),
      where("category", "==", category),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const uploads = [];

    querySnapshot.forEach((doc) => {
      uploads.push({ id: doc.id, ...doc.data() });
    });

    return uploads.slice(0, limit);
  } catch (error) {
    console.error("Error fetching uploads by category:", error);
    throw error;
  }
};

/**
 * Get upload statistics for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} - Statistics
 */
export const getUploadStats = async (organizationId) => {
  try {
    const uploads = await getOrganizationUploads(organizationId);

    const stats = {
      totalFiles: uploads.length,
      totalSize: uploads.reduce(
        (sum, upload) => sum + (upload.fileSize || 0),
        0
      ),
      totalDownloads: uploads.reduce(
        (sum, upload) => sum + (upload.downloadCount || 0),
        0
      ),
      byCategory: {},
      byType: {},
    };

    // Group by category
    uploads.forEach((upload) => {
      const cat = upload.category || "Uncategorized";
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });

    // All are PDFs
    stats.byType["pdf"] = uploads.length;

    return stats;
  } catch (error) {
    console.error("Error getting upload stats:", error);
    throw error;
  }
};

/**
 * Download file (returns Cloudinary URL and tracks download)
 * @param {string} uploadId - Upload ID
 * @param {string} userId - User ID (optional, for tracking user downloads)
 * @returns {Promise<string>} - File URL
 */
export const downloadFile = async (uploadId, userId = null) => {
  try {
    const upload = await getUploadById(uploadId);
    await incrementDownloadCount(uploadId);

    // Track user download if userId provided (for cross-device sync)
    if (userId) {
      const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
      const { db } = await import("../firebaseconfig");

      try {
        console.log(
          "💾 Tracking download for user:",
          userId,
          "uploadId:",
          uploadId
        );
        await updateDoc(doc(db, "profiles", userId), {
          downloadedResources: arrayUnion(uploadId),
        });
        console.log("✅ Download tracked successfully in Firestore");
      } catch (error) {
        console.error("❌ Error tracking user download:", error);
        // Don't fail the download if tracking fails
        // User can still access the file, just won't be tracked
      }
    }

    return getFileUrl(upload);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Get all active uploads from all organizations (for student Library view)
 * Only includes uploads from verified organizations
 * @param {number} limit - Optional limit on number of results
 * @returns {Promise<Array>} - Array of all active uploads with organization info
 */
export const getAllActiveUploads = async (limit = null) => {
  try {
    console.log("📚 Fetching all active uploads for Library...");

    const q = query(
      collection(db, "uploads"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    console.log("📊 Query returned", querySnapshot.size, "documents");

    const uploads = [];

    querySnapshot.forEach((doc) => {
      uploads.push({ id: doc.id, ...doc.data() });
    });

    console.log("✅ Total active uploads:", uploads.length);

    // Get unique organization IDs
    const organizationIds = [
      ...new Set(
        uploads
          .map((upload) => upload.organizationId)
          .filter((id) => typeof id === "string" && id.length)
      ),
    ];

    // Fetch organization profiles to check verification status
    let profilesMap = new Map();
    if (organizationIds.length > 0) {
      const profilePromises = organizationIds.map(async (orgId) => {
        try {
          const profileSnap = await getDoc(doc(db, "profiles", orgId));
          return [orgId, profileSnap.exists() ? profileSnap.data() : null];
        } catch (error) {
          console.error(`Error fetching profile for ${orgId}:`, error);
          return [orgId, null];
        }
      });
      const profileEntries = await Promise.all(profilePromises);
      profilesMap = new Map(profileEntries);
    }

    // Filter uploads from verified organizations only and add organization info
    const verifiedUploads = uploads
      .map((upload) => {
        const profile = profilesMap.get(upload.organizationId) || null;
        const isVerified = profile?.verificationStatus === "verified";

        return {
          ...upload,
          organizationName: profile?.name || "Organization",
          organizationVerificationStatus:
            profile?.verificationStatus || "pending",
          isVerified,
        };
      })
      .filter((upload) => upload.isVerified); // Only show uploads from verified orgs

    console.log("✅ Verified uploads:", verifiedUploads.length);

    return limit ? verifiedUploads.slice(0, limit) : verifiedUploads;
  } catch (error) {
    console.error("❌ Error fetching all uploads:", error);
    throw error;
  }
};
