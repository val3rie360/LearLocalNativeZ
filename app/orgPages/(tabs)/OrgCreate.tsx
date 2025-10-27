import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Text as RNText,
  TextInput as RNTextInput,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "../../../components/PlatformMap";
import { useAuth } from "../../../contexts/AuthContext";
import {
  formatFileSize,
  uploadPDF,
  validateFile,
} from "../../../services/cloudinaryUploadService";
import { createOpportunity } from "../../../services/firestoreService";

const categories = [
  "Scholarship / Grant",
  "Competition / Event",
  "Workshop / Seminar",
  "Resources",
  "Study Spot",
];

const Text = ({
  className = "",
  ...props
}: React.ComponentProps<typeof RNText>) => (
  <RNText className={`${className} font-karla`} {...props} />
);

const TextInput = React.forwardRef<
  RNTextInput,
  React.ComponentProps<typeof RNTextInput>
>(({ className = "", ...props }, ref) => (
  <RNTextInput ref={ref} className={`${className} font-karla`} {...props} />
));
TextInput.displayName = "TextInput";

const OrgCreate = () => {
  const { user } = useAuth();
  const [file, setFile] = useState("");
  const [level, setLevel] = useState("");
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [subject, setSubject] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const levelOptions = [
    "Undergraduate",
    "Postgraduate",
    "High School",
    "Other",
  ];
  const subjectOptions = ["Math", "Science", "Arts", "Business", "Other"];
  const [category, setCategory] = useState("Scholarship / Grant");
  const [showDropdown, setShowDropdown] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateMilestones, setDateMilestones] = useState<
    Array<{ name: string; date: string }>
  >([]);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newMilestoneDateObj, setNewMilestoneDateObj] = useState(new Date());
  const [showMilestoneDatePicker, setShowMilestoneDatePicker] = useState(false);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [openTimeDate, setOpenTimeDate] = useState(new Date());
  const [closeTimeDate, setCloseTimeDate] = useState(new Date());
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [amount, setAmount] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryUploadId, setCloudinaryUploadId] = useState<string | null>(
    null
  );
  const [memorandumFile, setMemorandumFile] = useState<any>(null);
  const [memorandumUploadProgress, setMemorandumUploadProgress] = useState(0);
  const [isMemorandumUploading, setIsMemorandumUploading] = useState(false);
  const [memorandumCloudinaryId, setMemorandumCloudinaryId] = useState<
    string | null
  >(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [mapRegion, setMapRegion] = useState({
    latitude: 9.3077,
    longitude: 123.3054,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showMapModal, setShowMapModal] = useState(false);
  // Study Spot fields
  const [studySpotName, setStudySpotName] = useState("");
  const [studySpotLocation, setStudySpotLocation] = useState("");
  const [availabilityType, setAvailabilityType] = useState("Weekdays");
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] =
    useState(false);
  const [availabilityStartHour, setAvailabilityStartHour] = useState("");
  const [availabilityEndHour, setAvailabilityEndHour] = useState("");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);

  // Address search states
  const [addressSearch, setAddressSearch] = useState("");
  const [eventAddressSearch, setEventAddressSearch] = useState("");
  const [workshopAddressSearch, setWorkshopAddressSearch] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showEventAddressSuggestions, setShowEventAddressSuggestions] =
    useState(false);
  const [showWorkshopAddressSuggestions, setShowWorkshopAddressSuggestions] =
    useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [eventAddressSuggestions, setEventAddressSuggestions] = useState([]);
  const [workshopAddressSuggestions, setWorkshopAddressSuggestions] = useState(
    []
  );
  const hourOptions = [
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
  ];
  const [studySpotDetails, setStudySpotDetails] = useState("");
  const [link, setLink] = useState("");

  // Competition/Event specific fields
  const [isInPersonEvent, setIsInPersonEvent] = useState(false);
  const [eventLocation, setEventLocation] =
    useState<Location.LocationObject | null>(null);
  const [eventMapRegion, setEventMapRegion] = useState({
    latitude: 9.3077,
    longitude: 123.3054,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showEventMapModal, setShowEventMapModal] = useState(false);

  // Workshop/Seminar specific fields
  const [isInPersonWorkshop, setIsInPersonWorkshop] = useState(false);
  const [workshopLocation, setWorkshopLocation] =
    useState<Location.LocationObject | null>(null);
  const [workshopMapRegion, setWorkshopMapRegion] = useState({
    latitude: 9.3077,
    longitude: 123.3054,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showWorkshopMapModal, setShowWorkshopMapModal] = useState(false);

  // Workshop/Seminar specific fields
  const [workshopStarts, setWorkshopStarts] = useState("");
  const [workshopEnds, setWorkshopEnds] = useState("");
  const [workshopStartsDate, setWorkshopStartsDate] = useState(new Date());
  const [workshopEndsDate, setWorkshopEndsDate] = useState(new Date());
  const [showWorkshopStartsPicker, setShowWorkshopStartsPicker] =
    useState(false);
  const [showWorkshopEndsPicker, setShowWorkshopEndsPicker] = useState(false);
  const [repeats, setRepeats] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showDaySelector, setShowDaySelector] = useState(false);

  const daysOfWeek = [
    { key: "Monday", label: "Mon" },
    { key: "Tuesday", label: "Tue" },
    { key: "Wednesday", label: "Wed" },
    { key: "Thursday", label: "Thu" },
    { key: "Friday", label: "Fri" },
    { key: "Saturday", label: "Sat" },
    { key: "Sunday", label: "Sun" },
  ];

  const categoriesWithIcons = [
    { id: 1, name: "Scholarship / Grant", icon: "🎓" },
    { id: 2, name: "Competition / Event", icon: "🏆" },
    { id: 3, name: "Workshop / Seminar", icon: "🔧" },
    { id: 4, name: "Study Spot", icon: "📚" },
    { id: 5, name: "Resources", icon: "📄" },
  ];

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleOpenTimeChange = (event: any, selectedDate?: Date) => {
    console.log("Open time change:", event.type, selectedDate);

    if (Platform.OS === "android") {
      setShowOpenTimePicker(false);
    }

    if (selectedDate) {
      setOpenTimeDate(selectedDate);
      setOpenTime(formatTime(selectedDate));
    }
  };

  const handleCloseTimeChange = (event: any, selectedDate?: Date) => {
    console.log("Close time change:", event.type, selectedDate);

    if (Platform.OS === "android") {
      setShowCloseTimePicker(false);
    }

    if (selectedDate) {
      setCloseTimeDate(selectedDate);
      setCloseTime(formatTime(selectedDate));
    }
  };

  const confirmOpenTime = () => {
    setOpenTime(formatTime(openTimeDate));
    setShowOpenTimePicker(false);
  };

  const confirmCloseTime = () => {
    setCloseTime(formatTime(closeTimeDate));
    setShowCloseTimePicker(false);
  };

  // Workshop time handlers
  const handleWorkshopStartsChange = (event: any, selectedDate?: Date) => {
    console.log("Workshop starts change:", event.type, selectedDate);

    if (Platform.OS === "android") {
      setShowWorkshopStartsPicker(false);
    }

    if (selectedDate) {
      setWorkshopStartsDate(selectedDate);
      setWorkshopStarts(formatTime(selectedDate));
    }
  };

  const handleWorkshopEndsChange = (event: any, selectedDate?: Date) => {
    console.log("Workshop ends change:", event.type, selectedDate);

    if (Platform.OS === "android") {
      setShowWorkshopEndsPicker(false);
    }

    if (selectedDate) {
      setWorkshopEndsDate(selectedDate);
      setWorkshopEnds(formatTime(selectedDate));
    }
  };

  const confirmWorkshopStarts = () => {
    setWorkshopStarts(formatTime(workshopStartsDate));
    setShowWorkshopStartsPicker(false);
  };

  const confirmWorkshopEnds = () => {
    setWorkshopEnds(formatTime(workshopEndsDate));
    setShowWorkshopEndsPicker(false);
  };

  // Day selection handlers
  const toggleDaySelection = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getSelectedDaysText = () => {
    if (selectedDays.length === 0) return "Select days";
    if (selectedDays.length === 7) return "Every day";
    if (selectedDays.length === 1) return selectedDays[0];
    return `${selectedDays.length} days selected`;
  };

  // Date milestone functions
  const addMilestone = () => {
    if (newMilestoneName.trim() && newMilestoneDate.trim()) {
      setDateMilestones((prev) => [
        ...prev,
        {
          name: newMilestoneName.trim(),
          date: newMilestoneDate.trim(),
        },
      ]);
      setNewMilestoneName("");
      setNewMilestoneDate("");
      setNewMilestoneDateObj(new Date());
    }
  };

  const removeMilestone = (index: number) => {
    setDateMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  // Date picker handlers for milestones
  const handleMilestoneDateChange = (event: any, selectedDate?: Date) => {
    console.log("Milestone date change:", event.type, selectedDate);

    if (Platform.OS === "android") {
      setShowMilestoneDatePicker(false);
    }

    if (selectedDate) {
      setNewMilestoneDateObj(selectedDate);
      setNewMilestoneDate(
        selectedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    }
  };

  const confirmMilestoneDate = () => {
    setNewMilestoneDate(
      newMilestoneDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
    setShowMilestoneDatePicker(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature"
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setShowMapModal(true);
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert(
        "Error",
        "Failed to get current location. You can still select a location manually on the map."
      );
      setShowMapModal(true);
    }
  };

  const getWorkshopCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature"
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setWorkshopLocation(currentLocation);
      setWorkshopMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setShowWorkshopMapModal(true);
    } catch (error) {
      console.log("Workshop location error:", error);
      Alert.alert(
        "Error",
        "Failed to get current location. You can still select a location manually on the map."
      );
      setShowWorkshopMapModal(true);
    }
  };

  const handleWorkshopMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = {
      coords: {
        latitude,
        longitude,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    setWorkshopLocation(newLocation);
  };

  // Address search functions
  const searchAddress = async (
    query: string,
    type: "study" | "event" | "workshop"
  ) => {
    if (query.length < 3) {
      if (type === "study") {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      } else if (type === "event") {
        setEventAddressSuggestions([]);
        setShowEventAddressSuggestions(false);
      } else if (type === "workshop") {
        setWorkshopAddressSuggestions([]);
        setShowWorkshopAddressSuggestions(false);
      }
      return;
    }

    try {
      // Using Google Places API for address suggestions
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&types=address`
      );
      const data = await response.json();

      if (data.predictions) {
        if (type === "study") {
          setAddressSuggestions(data.predictions);
          setShowAddressSuggestions(true);
        } else if (type === "event") {
          setEventAddressSuggestions(data.predictions);
          setShowEventAddressSuggestions(true);
        } else if (type === "workshop") {
          setWorkshopAddressSuggestions(data.predictions);
          setShowWorkshopAddressSuggestions(true);
        }
      }
    } catch (error) {
      console.error("Address search error:", error);
    }
  };

  const selectAddress = async (
    placeId: string,
    description: string,
    type: "study" | "event" | "workshop"
  ) => {
    try {
      // Get place details including coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&fields=geometry,formatted_address`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const newLocation = {
          coords: {
            latitude: lat,
            longitude: lng,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        if (type === "study") {
          setLocation(newLocation);
          setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setAddressSearch(description);
          setShowAddressSuggestions(false);
        } else if (type === "event") {
          setEventLocation(newLocation);
          setEventMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setEventAddressSearch(description);
          setShowEventAddressSuggestions(false);
        } else if (type === "workshop") {
          setWorkshopLocation(newLocation);
          setWorkshopMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setWorkshopAddressSearch(description);
          setShowWorkshopAddressSuggestions(false);
        }
      }
    } catch (error) {
      console.error("Address selection error:", error);
    }
  };

  const getEventCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature"
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setEventLocation(currentLocation);
      setEventMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setShowEventMapModal(true);
    } catch (error) {
      console.log("Event location error:", error);
      Alert.alert(
        "Error",
        "Failed to get current location. You can still select a location manually on the map."
      );
      setShowEventMapModal(true);
    }
  };

  const handleEventMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = {
      coords: {
        latitude,
        longitude,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    setEventLocation(newLocation);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = {
      coords: {
        latitude,
        longitude,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    setLocation(newLocation);
  };

  const confirmLocation = () => {
    if (location) {
      setShowMapModal(false);
      Alert.alert("Success", "Location selected successfully!");
    }
  };

  const handleFileUpload = async () => {
    try {
      // Step 1: Pick the file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const pickedFile = result.assets[0];

      // Step 2: Validate the file
      const validation = validateFile({
        name: pickedFile.name,
        mimeType: pickedFile.mimeType,
        size: pickedFile.size,
      });

      if (!validation.valid) {
        Alert.alert("Invalid File", validation.error);
        return;
      }

      // Show file info
      Alert.alert(
        "Upload PDF?",
        `File: ${pickedFile.name}\nSize: ${formatFileSize(
          pickedFile.size
        )}\n\nReady to upload this file?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload",
            onPress: async () => {
              setIsUploading(true);
              setUploadProgress(0);

              try {
                // Step 3: Upload to Cloudinary
                console.log("Starting Cloudinary upload...");
                const uploadId = await uploadPDF(
                  {
                    uri: pickedFile.uri,
                    name: pickedFile.name,
                    mimeType: pickedFile.mimeType,
                    size: pickedFile.size,
                  },
                  user?.uid || "",
                  {
                    displayName: title || pickedFile.name,
                    description: description || "",
                    category: category,
                    tags: [category],
                  },
                  (progress: number) => {
                    setUploadProgress(progress);
                  }
                );

                // Success!
                console.log(
                  "Cloudinary upload successful! Upload ID:",
                  uploadId
                );
                setCloudinaryUploadId(uploadId);
                setUploadedFile(pickedFile);
                Alert.alert("Success!", "PDF uploaded successfully!");
              } catch (error: any) {
                console.error("Cloudinary upload error:", error);
                Alert.alert(
                  "Upload Failed",
                  error.message || "Failed to upload PDF"
                );
              } finally {
                setIsUploading(false);
                setUploadProgress(0);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("File picker error:", error);
      Alert.alert("Error", "Failed to select PDF file");
    }
  };

  const handleMemorandumUpload = async () => {
    try {
      // Step 1: Pick the file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const pickedFile = result.assets[0];

      // Step 2: Validate the file
      const validation = validateFile({
        name: pickedFile.name,
        mimeType: pickedFile.mimeType,
        size: pickedFile.size,
      });

      if (!validation.valid) {
        Alert.alert("Invalid File", validation.error);
        return;
      }

      // Show file info
      Alert.alert(
        "Upload Memorandum?",
        `File: ${pickedFile.name}\nSize: ${formatFileSize(
          pickedFile.size
        )}\n\nReady to upload this memorandum?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload",
            onPress: async () => {
              setIsMemorandumUploading(true);
              setMemorandumUploadProgress(0);

              try {
                // Step 3: Upload to Cloudinary
                console.log("Starting Memorandum Cloudinary upload...");
                const uploadId = await uploadPDF(
                  {
                    uri: pickedFile.uri,
                    name: pickedFile.name,
                    mimeType: pickedFile.mimeType,
                    size: pickedFile.size,
                  },
                  user?.uid || "",
                  {
                    displayName: `Memorandum - ${title || pickedFile.name}`,
                    description: "Official Memorandum",
                    category: "Memorandum",
                    tags: [category, "memorandum", "official"],
                  },
                  (progress: number) => {
                    setMemorandumUploadProgress(progress);
                  }
                );

                // Success!
                console.log(
                  "Memorandum Cloudinary upload successful! Upload ID:",
                  uploadId
                );
                setMemorandumCloudinaryId(uploadId);
                setMemorandumFile(pickedFile);
                Alert.alert("Success!", "Memorandum uploaded successfully!");
              } catch (error: any) {
                console.error("Memorandum Cloudinary upload error:", error);
                Alert.alert(
                  "Upload Failed",
                  error.message || "Failed to upload memorandum"
                );
              } finally {
                setIsMemorandumUploading(false);
                setMemorandumUploadProgress(0);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Memorandum file picker error:", error);
      Alert.alert("Error", "Failed to select memorandum PDF file");
    }
  };

  const handleSubmit = async () => {
    // Clear previous error
    setErrorMessage("");

    // Validation
    if (!title.trim() || !description.trim()) {
      setErrorMessage(
        "Please fill in all required fields: Title and Description"
      );
      return;
    }

    if (!user?.uid) {
      setErrorMessage("You must be logged in to create an opportunity");
      return;
    }

    // Validate milestones for Scholarship/Competition categories
    if (
      category === "Scholarship / Grant" ||
      category === "Competition / Event" ||
      category === "Workshop / Seminar"
    ) {
      if (dateMilestones.length === 0) {
        setErrorMessage(
          "Please add at least one date milestone (e.g., Application Deadline)"
        );
        return;
      }

      // Check if there's an incomplete milestone in the form
      if (newMilestoneName.trim() || newMilestoneDate.trim()) {
        if (!newMilestoneName.trim() || !newMilestoneDate.trim()) {
          setErrorMessage(
            'Please complete the milestone form or click "Add Milestone" to save it'
          );
          return;
        }
      }
    }

    if (category === "Resources" && !cloudinaryUploadId) {
      setErrorMessage("Please upload a PDF file for resources category");
      return;
    }

    if (isUploading || isMemorandumUploading) {
      setErrorMessage("Please wait for the file upload to complete");
      return;
    }

    if (
      (category === "Study Spot" || category === "Workshop / Seminar") &&
      !location
    ) {
      setErrorMessage(`Please select a location for ${category.toLowerCase()}`);
      return;
    }

    // Validate in-person event location
    if (
      category === "Competition / Event" &&
      isInPersonEvent &&
      !eventLocation
    ) {
      setErrorMessage("Please select a location for the in-person event");
      return;
    }

    // Validate in-person workshop location
    if (
      category === "Workshop / Seminar" &&
      isInPersonWorkshop &&
      !workshopLocation
    ) {
      setErrorMessage("Please select a location for the in-person workshop");
      return;
    }

    const requiresLink = new Set([
      "Scholarship / Grant",
      "Competition / Event",
      "Workshop / Seminar",
    ]).has(category);
    if (requiresLink && !link.trim()) {
      setErrorMessage("Please provide a link for this opportunity");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the opportunity data based on category
      let opportunityData: any = {
        title: title.trim(),
        description: description.trim(),
      };

      if (requiresLink) {
        opportunityData.link = link.trim();
      }

      // Add category-specific fields
      if (
        category === "Scholarship / Grant" ||
        category === "Competition / Event"
      ) {
        // Scholarship/Competition specific fields
        opportunityData = {
          ...opportunityData,
          ...(amount && { amount: amount.trim() }),
          ...(eligibility && { eligibility: eligibility.trim() }),
          ...(dateMilestones.length > 0 && { dateMilestones }),
          ...(memorandumCloudinaryId && {
            memorandumCloudinaryId: memorandumCloudinaryId,
            memorandumFile: memorandumFile
              ? {
                  name: memorandumFile.name,
                  size: memorandumFile.size,
                  mimeType: memorandumFile.mimeType,
                }
              : null,
          }),
          // Event-specific fields
          ...(category === "Competition / Event" && {
            isInPersonEvent,
            ...(isInPersonEvent &&
              eventLocation && {
                location: {
                  latitude: eventLocation.coords.latitude,
                  longitude: eventLocation.coords.longitude,
                  timestamp: eventLocation.timestamp,
                },
              }),
          }),
        };
      } else if (category === "Workshop / Seminar") {
        // Workshop specific fields
        opportunityData = {
          ...opportunityData,
          workshopStarts: workshopStarts,
          workshopEnds: workshopEnds,
          repeats,
          ...(repeats && { selectedDays }),
          // Workshop event type and location
          isInPersonWorkshop,
          ...(isInPersonWorkshop &&
            workshopLocation && {
              location: {
                latitude: workshopLocation.coords.latitude,
                longitude: workshopLocation.coords.longitude,
                timestamp: workshopLocation.timestamp,
              },
            }),
        };
      } else if (category === "Study Spot") {
        // Study Spot specific fields
        if (location) {
          opportunityData = {
            ...opportunityData,
            openTime,
            closeTime,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: location.timestamp,
            },
          };
        }
      } else if (category === "Resources") {
        // Resources specific fields
        opportunityData = {
          ...opportunityData,
          cloudinaryUploadId: cloudinaryUploadId,
          uploadedFile: uploadedFile
            ? {
                name: uploadedFile.name,
                size: uploadedFile.size,
                mimeType: uploadedFile.mimeType,
              }
            : null,
        };
      }

      // Create the opportunity using the hybrid model
      const opportunityId = await createOpportunity(
        opportunityData,
        category,
        user.uid
      );

      console.log("Opportunity created with ID:", opportunityId);

      // Reset form
      setTitle("");
      setDescription("");
      setAmount("");
      setEligibility("");
      setDateMilestones([]);
      setNewMilestoneName("");
      setNewMilestoneDate("");
      setWorkshopStarts("");
      setWorkshopEnds("");
      setRepeats(false);
      setSelectedDays([]);
      setOpenTime("");
      setCloseTime("");
      setLocation(null);
      setUploadedFile(null);
      setCloudinaryUploadId(null);
      setUploadProgress(0);
      setIsUploading(false);
      setMemorandumFile(null);
      setMemorandumCloudinaryId(null);
      setMemorandumUploadProgress(0);
      setIsMemorandumUploading(false);
      setErrorMessage("");
      setLink("");

      Alert.alert("Success", "Opportunity posted successfully!", [
        { text: "OK", onPress: () => console.log("Opportunity created") },
      ]);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      setErrorMessage("Failed to create opportunity. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icon for category
  const getCategoryIcon = () => {
    if (category === "Competition / Event") {
      return (
        <FontAwesome6 name="award" size={22} color="#3C4251" className="mr-2" />
      );
    }
    if (category === "Resources") {
      return (
        <MaterialCommunityIcons name="bookshelf" size={24} color="#3C4251" />
      );
    }
    if (category === "Study Spot") {
      return <Ionicons name="location" size={24} color="#3C4251" />;
    }
    if (category === "Workshop / Seminar") {
      return (
        <FontAwesome6
          name="chalkboard-user"
          size={22}
          color="#3C4251"
          className="mr-2"
        />
      );
    }
    return (
      <FontAwesome6 name="scroll" size={22} color="#3C4251" className="mr-2" />
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#ECEAFF" }}
      edges={["top"]}
    >
      <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6 pt-10">
            {/* Header */}
            <View className="flex-row items-center mb-6 justify-center">
              <Text className="text-center text-xl font-karla-bold text-[#18181B]">
                New Opportunity
              </Text>
            </View>
            <View className="h-px bg-[#E5E0FF] mb-6" />

            {/* Error Message */}
            {errorMessage ? (
              <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text className="text-red-700 font-karla ml-2 flex-1">
                    {errorMessage}
                  </Text>
                  <TouchableOpacity onPress={() => setErrorMessage("")}>
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Category */}
            <Text className="text-sm text-[#18181B] font-karla-bold mb-1">
              Category
            </Text>
            <View
              className="flex-row items-center bg-white rounded-full mb-3 px-3 h-11 border border-[#E5E0FF] shadow"
              style={{ elevation: 4 }}
            >
              {getCategoryIcon()}
              <TouchableOpacity
                className="flex-1"
                activeOpacity={0.8}
                onPress={() => setShowDropdown(!showDropdown)}
                style={{ justifyContent: "center" }}
              >
                <Text className="text-base text-[#6B7280] font-karla px-2">
                  {category}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDropdown(!showDropdown)}
                className="ml-2"
                activeOpacity={0.8}
              >
                <Feather name="chevron-down" size={20} color="#4B1EB4" />
              </TouchableOpacity>
            </View>
            {/* Dropdown */}
            {showDropdown && (
              <View
                className="bg-white rounded-xl shadow border border-[#E5E0FF] mb-3 px-3 py-2 absolute left-6 right-6 z-10"
                style={{ top: 160 }}
              >
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    className="py-2"
                    onPress={() => {
                      setCategory(cat);
                      setShowDropdown(false);
                    }}
                  >
                    <Text
                      className={`text-base font-karla ${
                        category === cat
                          ? "text-[#4B1EB4] font-karla-bold"
                          : "text-[#18181B]"
                      }`}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Title */}
            <Text className="text-sm text-black font-semibold mb-1">
              {category === "Study Spot"
                ? "Name of Location *"
                : category === "Workshop / Seminar"
                ? "Workshop/Seminar Title *"
                : "Title *"}
            </Text>
            <TextInput
              className="bg-white rounded-xl px-3 h-11 text-base text-black mb-3"
              value={title}
              onChangeText={setTitle}
              placeholder={
                category === "Study Spot"
                  ? "Enter location name"
                  : category === "Workshop / Seminar"
                  ? "Enter workshop/seminar title"
                  : "Enter title"
              }
              placeholderTextColor="#aaa"
            />

            {/* Description */}
            <Text className="text-sm text-black font-semibold mb-1">
              {category === "Resources"
                ? "Resource Description *"
                : category === "Study Spot"
                ? "Location Details *"
                : category === "Workshop / Seminar"
                ? "Workshop/Seminar Description *"
                : "Description *"}
            </Text>
            <TextInput
              className="bg-white rounded-xl px-3 pt-3 text-base text-black mb-3 min-h-[80px] text-top"
              value={description}
              onChangeText={setDescription}
              placeholder={
                category === "Resources"
                  ? "Enter resource description"
                  : category === "Study Spot"
                  ? "Enter location details"
                  : category === "Workshop / Seminar"
                  ? "Enter workshop/seminar description"
                  : "Enter opportunity description"
              }
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
            />

            {/* Date Milestones - Only show for scholarship and competition categories */}
            {(category === "Scholarship / Grant" ||
              category === "Competition / Event" ||
              category === "Workshop / Seminar") && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Date Milestones *
                </Text>
                <Text className="text-xs text-gray-600 mb-2">
                  Add at least one important date (e.g., Application Deadline,
                  Event Start)
                </Text>

                {/* Display existing milestones */}
                {dateMilestones.map((milestone, index) => (
                  <View
                    key={index}
                    className="bg-white rounded-xl mb-2 px-3 py-2 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-karla-bold text-[#4B1EB4]">
                        {milestone.name}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {milestone.date}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeMilestone(index)}
                      className="ml-2 p-1"
                    >
                      <Text className="text-red-500 text-lg">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add new milestone form */}
                <View className="bg-white rounded-xl mb-3 p-3">
                  <View className="flex-row space-x-2 mb-2">
                    <TextInput
                      className="flex-1 bg-gray-50 rounded-lg px-3 h-10 text-base text-black"
                      value={newMilestoneName}
                      onChangeText={setNewMilestoneName}
                      placeholder="Milestone name (e.g., Registration Opens)"
                      placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                      className="flex-1 bg-gray-50 rounded-lg px-3 h-10 justify-center border border-gray-200"
                      onPress={() => setShowMilestoneDatePicker(true)}
                    >
                      <Text
                        className={`text-base ${
                          newMilestoneDate ? "text-black" : "text-gray-500"
                        }`}
                      >
                        {newMilestoneDate || "Select date"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={addMilestone}
                    className="bg-[#a084e8] rounded-lg py-2 items-center"
                    disabled={
                      !newMilestoneName.trim() || !newMilestoneDate.trim()
                    }
                  >
                    <Text className="text-white text-sm font-karla-bold">
                      Add Milestone
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Available Times - Show for Study Spot category */}
            {category === "Study Spot" && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Available Times
                </Text>
                <View className="flex-row space-x-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">Opens at</Text>
                    <TouchableOpacity
                      className="bg-white rounded-xl px-3 h-11 justify-center border border-gray-200"
                      onPress={() => {
                        console.log("Opening time picker");
                        setShowOpenTimePicker(true);
                      }}
                    >
                      <Text
                        className={`text-base ${
                          openTime ? "text-black" : "text-gray-500"
                        }`}
                      >
                        {openTime || "Select time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">
                      Closes at
                    </Text>
                    <TouchableOpacity
                      className="bg-white rounded-xl px-3 h-11 justify-center border border-gray-200"
                      onPress={() => {
                        console.log("Opening close time picker");
                        setShowCloseTimePicker(true);
                      }}
                    >
                      <Text
                        className={`text-base ${
                          closeTime ? "text-black" : "text-gray-500"
                        }`}
                      >
                        {closeTime || "Select time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Workshop/Seminar Event Type - Show for Workshop / Seminar category */}
            {category === "Workshop / Seminar" && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Workshop Type
                </Text>
                <View className="flex-row items-center mb-3">
                  <TouchableOpacity
                    className={`flex-row items-center px-3 py-2 rounded-lg mr-3 ${
                      !isInPersonWorkshop
                        ? "bg-blue-100 border-2 border-blue-300"
                        : "bg-gray-100 border-2 border-gray-300"
                    }`}
                    onPress={() => setIsInPersonWorkshop(false)}
                  >
                    <Text
                      className={`text-lg mr-2 ${
                        !isInPersonWorkshop ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      🌐
                    </Text>
                    <Text
                      className={`font-karla ${
                        !isInPersonWorkshop
                          ? "text-blue-700 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      Online
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-row items-center px-3 py-2 rounded-lg ${
                      isInPersonWorkshop
                        ? "bg-green-100 border-2 border-green-300"
                        : "bg-gray-100 border-2 border-gray-300"
                    }`}
                    onPress={() => setIsInPersonWorkshop(true)}
                  >
                    <Text
                      className={`text-lg mr-2 ${
                        isInPersonWorkshop ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      🏢
                    </Text>
                    <Text
                      className={`font-karla ${
                        isInPersonWorkshop
                          ? "text-green-700 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      In-Person
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Location Picker - Only show if in-person workshop is selected */}
                {isInPersonWorkshop && (
                  <>
                    <Text className="text-sm text-black font-semibold mb-1">
                      Workshop Location *
                    </Text>
                    <TouchableOpacity
                      className={`rounded-xl px-3 h-11 justify-center border mb-3 ${
                        workshopLocation
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-gray-200"
                      }`}
                      onPress={getWorkshopCurrentLocation}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">
                          {workshopLocation ? "✅" : "📍"}
                        </Text>
                        <Text
                          className={`text-base flex-1 ${
                            workshopLocation ? "text-green-800" : "text-black"
                          }`}
                        >
                          {workshopLocation
                            ? `Workshop location selected: ${workshopLocation.coords.latitude.toFixed(
                                4
                              )}, ${workshopLocation.coords.longitude.toFixed(
                                4
                              )}`
                            : "Tap to select workshop location"}
                        </Text>
                        <Text className="text-lg text-gray-400">→</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Workshop/Seminar Schedule - Show for Workshop / Seminar category */}
            {category === "Workshop / Seminar" && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Workshop Schedule
                </Text>
                <View className="flex-row space-x-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">
                      Starts at
                    </Text>
                    <TouchableOpacity
                      className="bg-white rounded-xl px-3 h-11 justify-center border border-gray-200"
                      onPress={() => {
                        console.log("Opening workshop starts picker");
                        setShowWorkshopStartsPicker(true);
                      }}
                    >
                      <Text
                        className={`text-base ${
                          workshopStarts ? "text-black" : "text-gray-500"
                        }`}
                      >
                        {workshopStarts || "Select start time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">Ends at</Text>
                    <TouchableOpacity
                      className="bg-white rounded-xl px-3 h-11 justify-center border border-gray-200"
                      onPress={() => {
                        console.log("Opening workshop ends picker");
                        setShowWorkshopEndsPicker(true);
                      }}
                    >
                      <Text
                        className={`text-base ${
                          workshopEnds ? "text-black" : "text-gray-500"
                        }`}
                      >
                        {workshopEnds || "Select end time"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Repeat Option */}
                <View className="mb-3 bg-gray-50 p-3 rounded-xl">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-black font-semibold">
                      Repeats
                    </Text>
                    <TouchableOpacity
                      className={`w-12 h-6 rounded-full border-2 ${
                        repeats
                          ? "bg-[#a084e8] border-[#a084e8]"
                          : "bg-gray-200 border-gray-300"
                      }`}
                      onPress={() => setRepeats(!repeats)}
                    >
                      <View
                        className="w-5 h-5 rounded-full bg-white"
                        style={{
                          transform: [{ translateX: repeats ? 24 : 0 }],
                        }}
                      />
                    </TouchableOpacity>
                  </View>

                  {repeats && (
                    <View className="bg-white rounded-xl px-3 py-3 border border-gray-200">
                      <Text className="text-sm text-gray-600 mb-2">
                        Repeat on days:
                      </Text>
                      <TouchableOpacity
                        className="flex-row items-center justify-between py-2"
                        onPress={() => setShowDaySelector(!showDaySelector)}
                      >
                        <Text className="text-base text-black">
                          {getSelectedDaysText()}
                        </Text>
                        <Text className="text-lg text-gray-400">
                          {showDaySelector ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>

                      {showDaySelector && (
                        <View className="mt-2">
                          <View className="flex-row flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <TouchableOpacity
                                key={day.key}
                                className={`px-3 py-2 rounded-full border ${
                                  selectedDays.includes(day.key)
                                    ? "bg-[#a084e8] border-[#a084e8]"
                                    : "bg-gray-100 border-gray-300"
                                }`}
                                onPress={() => toggleDaySelection(day.key)}
                              >
                                <Text
                                  className={`text-sm font-karla ${
                                    selectedDays.includes(day.key)
                                      ? "text-white"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {day.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Amount - Only show for scholarship and competition categories */}
            {category !== "Resources" &&
              category !== "Study Spot" &&
              category !== "Workshop / Seminar" && (
                <>
                  <Text className="text-sm text-black font-semibold mb-1">
                    Amount
                  </Text>
                  <TextInput
                    className="bg-white rounded-xl px-3 h-11 text-base text-black mb-3"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                  />
                </>
              )}

            {/* Official Memorandum Upload - Only show for scholarship and competition categories */}
            {(category === "Scholarship / Grant" ||
              category === "Competition / Event" ||
              category === "Workshop / Seminar") && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Official Memorandum (Optional)
                </Text>
                <Text className="text-xs text-gray-600 mb-2">
                  Upload an official memorandum or announcement document
                </Text>
                <TouchableOpacity
                  className={`rounded-xl px-3 py-3 mb-3 border-2 ${
                    memorandumFile
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-dashed border-gray-300"
                  }`}
                  onPress={handleMemorandumUpload}
                  disabled={isMemorandumUploading}
                >
                  <View className="items-center">
                    {isMemorandumUploading ? (
                      <>
                        <Text className="text-2xl mb-2">⏳</Text>
                        <Text className="text-base text-gray-600 font-karla-bold">
                          Uploading... {memorandumUploadProgress}%
                        </Text>
                        {/* Progress Bar */}
                        <View className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <View
                            className="bg-[#a084e8] h-2 rounded-full"
                            style={{ width: `${memorandumUploadProgress}%` }}
                          />
                        </View>
                      </>
                    ) : memorandumFile ? (
                      <>
                        <Text className="text-2xl mb-2">📋</Text>
                        <Text className="text-base text-green-700 font-karla-bold">
                          {memorandumFile.name}
                        </Text>
                        <Text className="text-sm text-green-600 mt-1">
                          {formatFileSize(memorandumFile.size)} • Ready
                        </Text>
                        <Text className="text-xs text-gray-500 mt-2">
                          Tap to upload a different file
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-2xl mb-2">📋</Text>
                        <Text className="text-base text-gray-600">
                          Tap to upload memorandum (PDF)
                        </Text>
                        <Text className="text-sm text-gray-400 mt-1">
                          PDF files only • Max 50MB
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* In-Person Event Location - Only show for Competition / Event category */}
            {category === "Competition / Event" && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Event Type
                </Text>
                <View className="flex-row items-center mb-3">
                  <TouchableOpacity
                    className={`flex-row items-center px-3 py-2 rounded-lg mr-3 ${
                      !isInPersonEvent
                        ? "bg-blue-100 border-2 border-blue-300"
                        : "bg-gray-100 border-2 border-gray-300"
                    }`}
                    onPress={() => setIsInPersonEvent(false)}
                  >
                    <Text
                      className={`text-lg mr-2 ${
                        !isInPersonEvent ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      🌐
                    </Text>
                    <Text
                      className={`font-karla ${
                        !isInPersonEvent
                          ? "text-blue-700 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      Online
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-row items-center px-3 py-2 rounded-lg ${
                      isInPersonEvent
                        ? "bg-green-100 border-2 border-green-300"
                        : "bg-gray-100 border-2 border-gray-300"
                    }`}
                    onPress={() => setIsInPersonEvent(true)}
                  >
                    <Text
                      className={`text-lg mr-2 ${
                        isInPersonEvent ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      🏢
                    </Text>
                    <Text
                      className={`font-karla ${
                        isInPersonEvent
                          ? "text-green-700 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      In-Person
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Location Picker - Only show if in-person event is selected */}
                {isInPersonEvent && (
                  <>
                    <Text className="text-sm text-black font-semibold mb-1">
                      Event Location *
                    </Text>
                    <TouchableOpacity
                      className={`rounded-xl px-3 h-11 justify-center border mb-3 ${
                        eventLocation
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-gray-200"
                      }`}
                      onPress={getEventCurrentLocation}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">
                          {eventLocation ? "✅" : "📍"}
                        </Text>
                        <Text
                          className={`text-base flex-1 ${
                            eventLocation ? "text-green-800" : "text-black"
                          }`}
                        >
                          {eventLocation
                            ? `Event location selected: ${eventLocation.coords.latitude.toFixed(
                                4
                              )}, ${eventLocation.coords.longitude.toFixed(4)}`
                            : "Tap to select event location"}
                        </Text>
                        <Text className="text-lg text-gray-400">→</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Location Picker - Show for Study Spot only */}
            {category === "Study Spot" && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Location *
                </Text>
                <TouchableOpacity
                  className={`rounded-xl px-3 h-11 justify-center border mb-3 ${
                    location
                      ? "bg-green-50 border-green-300"
                      : "bg-white border-gray-200"
                  }`}
                  onPress={getCurrentLocation}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">
                      {location ? "✅" : "📍"}
                    </Text>
                    <Text
                      className={`text-base flex-1 ${
                        location ? "text-green-800" : "text-black"
                      }`}
                    >
                      {location
                        ? `Location selected: ${location.coords.latitude.toFixed(
                            4
                          )}, ${location.coords.longitude.toFixed(4)}`
                        : "Tap to select study spot location"}
                    </Text>
                    <Text className="text-lg text-gray-400">→</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* File Upload Section - Only show for Resources category */}
            {category === "Resources" && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Upload PDF Resource *
                </Text>
                <TouchableOpacity
                  className={`rounded-xl px-3 py-3 mb-3 border-2 ${
                    uploadedFile
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-dashed border-gray-300"
                  }`}
                  onPress={handleFileUpload}
                  disabled={isUploading}
                >
                  <View className="items-center">
                    {isUploading ? (
                      <>
                        <Text className="text-2xl mb-2">⏳</Text>
                        <Text className="text-base text-gray-600 font-karla-bold">
                          Uploading... {uploadProgress}%
                        </Text>
                        {/* Progress Bar */}
                        <View className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <View
                            className="bg-[#a084e8] h-2 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </View>
                      </>
                    ) : uploadedFile ? (
                      <>
                        <Text className="text-2xl mb-2">✅</Text>
                        <Text className="text-base text-green-700 font-karla-bold">
                          {uploadedFile.name}
                        </Text>
                        <Text className="text-sm text-green-600 mt-1">
                          {formatFileSize(uploadedFile.size)} • Ready
                        </Text>
                        <Text className="text-xs text-gray-500 mt-2">
                          Tap to upload a different file
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-2xl mb-2">📄</Text>
                        <Text className="text-base text-gray-600">
                          Tap to upload PDF
                        </Text>
                        <Text className="text-sm text-gray-400 mt-1">
                          PDF files only • Max 50MB
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {[
              "Scholarship / Grant",
              "Competition / Event",
              "Workshop / Seminar",
            ].includes(category) && (
              <>
                <Text className="text-sm text-black font-semibold mb-1">
                  Link *
                </Text>
                <TextInput
                  className="bg-white rounded-xl px-3 h-11 text-base text-black mb-3"
                  value={link}
                  onChangeText={setLink}
                  placeholder="Enter registration/application link"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-[#a084e8] rounded-full py-3 items-center mt-2 mb-8 shadow"
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text className="text-white text-base font-karla-bold">
                {isSubmitting ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Selection Modal */}
          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl p-6">
                <Text className="text-lg font-bold text-black mb-4 text-center">
                  Select Category
                </Text>
                {categoriesWithIcons.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className="flex-row items-center py-4 border-b border-gray-200"
                    onPress={() => handleCategorySelect(cat.name)}
                  >
                    <Text className="text-2xl mr-4">{cat.icon}</Text>
                    <Text className="text-base text-black flex-1">
                      {cat.name}
                    </Text>
                    {category === cat.name && (
                      <Text className="text-lg text-[#a084e8]">✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  className="bg-gray-200 rounded-xl py-3 mt-4"
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text className="text-center text-base text-gray-600">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Time Pickers */}
          {showOpenTimePicker && (
            <>
              {Platform.OS === "ios" ? (
                <Modal
                  visible={showOpenTimePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowOpenTimePicker(false)}
                >
                  <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                      <Text className="text-lg font-bold text-[#a084e8] mb-4 text-center">
                        Select Opening Time
                      </Text>
                      <View className="bg-gray-50 rounded-xl p-2 border border-gray-200">
                        <DateTimePicker
                          value={openTimeDate}
                          mode="time"
                          is24Hour={false}
                          display="spinner"
                          onChange={handleOpenTimeChange}
                          style={{
                            backgroundColor: "transparent",
                          }}
                          textColor="#333333"
                          accentColor="#a084e8"
                        />
                      </View>
                      <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                          className="flex-1 bg-gray-200 rounded-xl py-3"
                          onPress={() => setShowOpenTimePicker(false)}
                        >
                          <Text className="text-center text-base text-gray-600">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-[#a084e8] rounded-xl py-3"
                          onPress={confirmOpenTime}
                        >
                          <Text className="text-center text-base text-white font-bold">
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={openTimeDate}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleOpenTimeChange}
                  textColor="#333333"
                  accentColor="#a084e8"
                />
              )}
            </>
          )}

          {showCloseTimePicker && (
            <>
              {Platform.OS === "ios" ? (
                <Modal
                  visible={showCloseTimePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowCloseTimePicker(false)}
                >
                  <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                      <Text className="text-lg font-bold text-[#a084e8] mb-4 text-center">
                        Select Closing Time
                      </Text>
                      <View className="bg-gray-50 rounded-xl p-2 border border-gray-200">
                        <DateTimePicker
                          value={closeTimeDate}
                          mode="time"
                          is24Hour={false}
                          display="spinner"
                          onChange={handleCloseTimeChange}
                          style={{
                            backgroundColor: "transparent",
                          }}
                          textColor="#333333"
                          accentColor="#a084e8"
                        />
                      </View>
                      <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                          className="flex-1 bg-gray-200 rounded-xl py-3"
                          onPress={() => setShowCloseTimePicker(false)}
                        >
                          <Text className="text-center text-base text-gray-600">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-[#a084e8] rounded-xl py-3"
                          onPress={confirmCloseTime}
                        >
                          <Text className="text-center text-base text-white font-bold">
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={closeTimeDate}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleCloseTimeChange}
                  textColor="#333333"
                  accentColor="#a084e8"
                />
              )}
            </>
          )}

          {/* Workshop Starts Time Picker */}
          {showWorkshopStartsPicker && (
            <>
              {Platform.OS === "ios" ? (
                <Modal
                  visible={showWorkshopStartsPicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowWorkshopStartsPicker(false)}
                >
                  <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                      <Text className="text-lg font-bold text-[#a084e8] mb-4 text-center">
                        Select Workshop Start Time
                      </Text>
                      <View className="bg-gray-50 rounded-xl p-2 border border-gray-200">
                        <DateTimePicker
                          value={workshopStartsDate}
                          mode="time"
                          is24Hour={false}
                          display="spinner"
                          onChange={handleWorkshopStartsChange}
                          style={{
                            backgroundColor: "transparent",
                          }}
                          textColor="#333333"
                          accentColor="#a084e8"
                        />
                      </View>
                      <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                          className="flex-1 bg-gray-200 rounded-xl py-3"
                          onPress={() => setShowWorkshopStartsPicker(false)}
                        >
                          <Text className="text-center text-base text-gray-600">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-[#a084e8] rounded-xl py-3"
                          onPress={confirmWorkshopStarts}
                        >
                          <Text className="text-center text-base text-white font-bold">
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={workshopStartsDate}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleWorkshopStartsChange}
                  textColor="#333333"
                  accentColor="#a084e8"
                />
              )}
            </>
          )}

          {/* Workshop Ends Time Picker */}
          {showWorkshopEndsPicker && (
            <>
              {Platform.OS === "ios" ? (
                <Modal
                  visible={showWorkshopEndsPicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowWorkshopEndsPicker(false)}
                >
                  <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                      <Text className="text-lg font-bold text-[#a084e8] mb-4 text-center">
                        Select Workshop End Time
                      </Text>
                      <View className="bg-gray-50 rounded-xl p-2 border border-gray-200">
                        <DateTimePicker
                          value={workshopEndsDate}
                          mode="time"
                          is24Hour={false}
                          display="spinner"
                          onChange={handleWorkshopEndsChange}
                          style={{
                            backgroundColor: "transparent",
                          }}
                          textColor="#333333"
                          accentColor="#a084e8"
                        />
                      </View>
                      <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                          className="flex-1 bg-gray-200 rounded-xl py-3"
                          onPress={() => setShowWorkshopEndsPicker(false)}
                        >
                          <Text className="text-center text-base text-gray-600">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-[#a084e8] rounded-xl py-3"
                          onPress={confirmWorkshopEnds}
                        >
                          <Text className="text-center text-base text-white font-bold">
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={workshopEndsDate}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleWorkshopEndsChange}
                  textColor="#333333"
                  accentColor="#a084e8"
                />
              )}
            </>
          )}

          {/* Location Selection Modal - Only for Study Spot */}
          {category === "Study Spot" && (
            <Modal
              visible={showMapModal}
              transparent={false}
              animationType="slide"
              onRequestClose={() => setShowMapModal(false)}
            >
              <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between pt-12 pb-4 px-4 bg-[#a084e8]">
                  <TouchableOpacity
                    onPress={() => setShowMapModal(false)}
                    className="bg-white rounded-full p-2"
                  >
                    <Text className="text-lg text-[#a084e8] font-bold">←</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-bold text-white">
                    Select Location
                  </Text>
                  <View className="w-10" />
                </View>

                {/* Address Search */}
                <View className="p-4 bg-white border-b border-gray-200">
                  <Text className="text-sm text-gray-600 mb-2 font-karla-bold">
                    Search Address
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-200 mb-2"
                    placeholder="Type address to search..."
                    value={addressSearch}
                    onChangeText={(text) => {
                      setAddressSearch(text);
                      searchAddress(text, "study");
                    }}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowAddressSuggestions(true);
                      }
                    }}
                  />

                  {/* Address Suggestions */}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <View className="bg-white border border-gray-200 rounded-xl max-h-40">
                      <ScrollView>
                        {addressSuggestions.map(
                          (suggestion: any, index: number) => (
                            <TouchableOpacity
                              key={index}
                              className="px-3 py-3 border-b border-gray-100"
                              onPress={() =>
                                selectAddress(
                                  suggestion.place_id,
                                  suggestion.description,
                                  "study"
                                )
                              }
                            >
                              <Text className="text-sm text-gray-800 font-karla">
                                {suggestion.description}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Map */}
                <View className="flex-1">
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: 9.3077,
                      longitude: 123.3054,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    region={mapRegion}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    mapType="standard"
                    onMapReady={() => console.log("Study Spot Map Ready")}
                    onError={(error) =>
                      console.log("Study Spot Map Error:", error)
                    }
                  >
                    {location && (
                      <Marker
                        coordinate={{
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude,
                        }}
                        title="Study Spot Location"
                        description="Selected location for study spot"
                        pinColor="#a084e8"
                      />
                    )}
                  </MapView>
                </View>

                {/* Instructions */}
                <View className="p-4 bg-gray-50">
                  <Text className="text-sm text-gray-600 text-center mb-2">
                    Tap anywhere on the map to place a pin for your study spot
                    location
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">
                    {location
                      ? `Current selection: ${location.coords.latitude.toFixed(
                          6
                        )}, ${location.coords.longitude.toFixed(6)}`
                      : "No location selected yet"}
                  </Text>
                </View>

                {/* Confirmation Button */}
                <View className="p-4 bg-white border-t border-gray-200">
                  <View className="flex-row space-x-3 mb-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-500 rounded-xl py-3"
                      onPress={getCurrentLocation}
                    >
                      <Text className="text-white text-center font-bold">
                        📍 Use Current Location
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className={`rounded-xl py-4 px-6 ${
                      location ? "bg-[#a084e8]" : "bg-gray-300"
                    }`}
                    onPress={() => setShowMapModal(false)}
                    disabled={!location}
                  >
                    <Text
                      className={`text-center text-lg font-bold ${
                        location ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {location
                        ? "✓ Confirm Location"
                        : "Select a location first"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Event Location Selection Modal - Only for Competition/Event */}
          {category === "Competition / Event" && isInPersonEvent && (
            <Modal
              visible={showEventMapModal}
              transparent={false}
              animationType="slide"
              onRequestClose={() => setShowEventMapModal(false)}
            >
              <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between pt-12 pb-4 px-4 bg-[#a084e8]">
                  <TouchableOpacity
                    onPress={() => setShowEventMapModal(false)}
                    className="bg-white rounded-full p-2"
                  >
                    <Text className="text-lg text-[#a084e8] font-bold">←</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-lg font-bold">
                    Select Event Location
                  </Text>
                  <View className="w-10" />
                </View>

                {/* Address Search */}
                <View className="p-4 bg-white border-b border-gray-200">
                  <Text className="text-sm text-gray-600 mb-2 font-karla-bold">
                    Search Address
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-200 mb-2"
                    placeholder="Type address to search..."
                    value={eventAddressSearch}
                    onChangeText={(text) => {
                      setEventAddressSearch(text);
                      searchAddress(text, "event");
                    }}
                    onFocus={() => {
                      if (eventAddressSuggestions.length > 0) {
                        setShowEventAddressSuggestions(true);
                      }
                    }}
                  />

                  {/* Address Suggestions */}
                  {showEventAddressSuggestions &&
                    eventAddressSuggestions.length > 0 && (
                      <View className="bg-white border border-gray-200 rounded-xl max-h-40">
                        <ScrollView>
                          {eventAddressSuggestions.map(
                            (suggestion: any, index: number) => (
                              <TouchableOpacity
                                key={index}
                                className="px-3 py-3 border-b border-gray-100"
                                onPress={() =>
                                  selectAddress(
                                    suggestion.place_id,
                                    suggestion.description,
                                    "event"
                                  )
                                }
                              >
                                <Text className="text-sm text-gray-800 font-karla">
                                  {suggestion.description}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                </View>

                {/* Map */}
                <View className="flex-1">
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: 9.3077,
                      longitude: 123.3054,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    region={eventMapRegion}
                    onPress={handleEventMapPress}
                    onMapReady={() => console.log("Event Map Ready")}
                    onError={(error) => console.log("Event Map Error:", error)}
                  >
                    {eventLocation && (
                      <Marker
                        coordinate={{
                          latitude: eventLocation.coords.latitude,
                          longitude: eventLocation.coords.longitude,
                        }}
                        title="Event Location"
                        description="Selected location for event"
                        pinColor="#a084e8"
                      />
                    )}
                  </MapView>
                </View>

                {/* Instructions */}
                <View className="p-4 bg-gray-50">
                  <Text className="text-sm text-gray-600 text-center mb-2">
                    Tap anywhere on the map to place a pin for your event
                    location
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">
                    {eventLocation
                      ? `Current selection: ${eventLocation.coords.latitude.toFixed(
                          6
                        )}, ${eventLocation.coords.longitude.toFixed(6)}`
                      : "No location selected yet"}
                  </Text>
                </View>

                {/* Confirmation Button */}
                <View className="p-4 bg-white border-t border-gray-200">
                  <View className="flex-row space-x-3 mb-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-500 rounded-xl py-3"
                      onPress={getEventCurrentLocation}
                    >
                      <Text className="text-white text-center font-bold">
                        📍 Use Current Location
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className={`rounded-xl py-4 px-6 ${
                      eventLocation ? "bg-[#a084e8]" : "bg-gray-300"
                    }`}
                    onPress={() => setShowEventMapModal(false)}
                    disabled={!eventLocation}
                  >
                    <Text
                      className={`text-center text-lg font-bold ${
                        eventLocation ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {eventLocation
                        ? "✓ Confirm Location"
                        : "Select a location first"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Workshop Location Selection Modal - Only for Workshop/Seminar */}
          {category === "Workshop / Seminar" && isInPersonWorkshop && (
            <Modal
              visible={showWorkshopMapModal}
              transparent={false}
              animationType="slide"
              onRequestClose={() => setShowWorkshopMapModal(false)}
            >
              <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between pt-12 pb-4 px-4 bg-[#a084e8]">
                  <TouchableOpacity
                    onPress={() => setShowWorkshopMapModal(false)}
                    className="bg-white rounded-full p-2"
                  >
                    <Text className="text-lg text-[#a084e8] font-bold">←</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-lg font-bold">
                    Select Workshop Location
                  </Text>
                  <View className="w-10" />
                </View>

                {/* Address Search */}
                <View className="p-4 bg-white border-b border-gray-200">
                  <Text className="text-sm text-gray-600 mb-2 font-karla-bold">
                    Search Address
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-200 mb-2"
                    placeholder="Type address to search..."
                    value={workshopAddressSearch}
                    onChangeText={(text) => {
                      setWorkshopAddressSearch(text);
                      searchAddress(text, "workshop");
                    }}
                    onFocus={() => {
                      if (workshopAddressSuggestions.length > 0) {
                        setShowWorkshopAddressSuggestions(true);
                      }
                    }}
                  />

                  {/* Address Suggestions */}
                  {showWorkshopAddressSuggestions &&
                    workshopAddressSuggestions.length > 0 && (
                      <View className="bg-white border border-gray-200 rounded-xl max-h-40">
                        <ScrollView>
                          {workshopAddressSuggestions.map(
                            (suggestion: any, index: number) => (
                              <TouchableOpacity
                                key={index}
                                className="px-3 py-3 border-b border-gray-100"
                                onPress={() =>
                                  selectAddress(
                                    suggestion.place_id,
                                    suggestion.description,
                                    "workshop"
                                  )
                                }
                              >
                                <Text className="text-sm text-gray-800 font-karla">
                                  {suggestion.description}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                </View>

                {/* Map */}
                <View className="flex-1">
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: 9.3077,
                      longitude: 123.3054,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    region={workshopMapRegion}
                    onPress={handleWorkshopMapPress}
                    onMapReady={() => console.log("Workshop Map Ready")}
                    onError={(error) =>
                      console.log("Workshop Map Error:", error)
                    }
                  >
                    {workshopLocation && (
                      <Marker
                        coordinate={{
                          latitude: workshopLocation.coords.latitude,
                          longitude: workshopLocation.coords.longitude,
                        }}
                        title="Workshop Location"
                        description="Selected location for workshop"
                        pinColor="#a084e8"
                      />
                    )}
                  </MapView>
                </View>

                {/* Instructions */}
                <View className="p-4 bg-gray-50">
                  <Text className="text-sm text-gray-600 text-center mb-2">
                    Tap anywhere on the map to place a pin for your workshop
                    location
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">
                    {workshopLocation
                      ? `Current selection: ${workshopLocation.coords.latitude.toFixed(
                          6
                        )}, ${workshopLocation.coords.longitude.toFixed(6)}`
                      : "No location selected yet"}
                  </Text>
                </View>

                {/* Confirmation Button */}
                <View className="p-4 bg-white border-t border-gray-200">
                  <View className="flex-row space-x-3 mb-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-500 rounded-xl py-3"
                      onPress={getWorkshopCurrentLocation}
                    >
                      <Text className="text-white text-center font-bold">
                        📍 Use Current Location
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className={`rounded-xl py-4 px-6 ${
                      workshopLocation ? "bg-[#a084e8]" : "bg-gray-300"
                    }`}
                    onPress={() => setShowWorkshopMapModal(false)}
                    disabled={!workshopLocation}
                  >
                    <Text
                      className={`text-center text-lg font-bold ${
                        workshopLocation ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {workshopLocation
                        ? "✓ Confirm Location"
                        : "Select a location first"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Milestone Date Picker Modal */}
          {showMilestoneDatePicker && (
            <>
              {Platform.OS === "ios" ? (
                <Modal
                  visible={showMilestoneDatePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowMilestoneDatePicker(false)}
                >
                  <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                      <Text className="text-lg font-bold text-[#a084e8] mb-4 text-center">
                        Select Milestone Date
                      </Text>
                      <View className="bg-gray-50 rounded-xl p-2 border border-gray-200">
                        <DateTimePicker
                          value={newMilestoneDateObj}
                          mode="date"
                          display="spinner"
                          onChange={handleMilestoneDateChange}
                          style={{
                            backgroundColor: "transparent",
                          }}
                          textColor="#333333"
                          accentColor="#a084e8"
                        />
                      </View>
                      <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                          className="flex-1 bg-gray-200 rounded-xl py-3"
                          onPress={() => setShowMilestoneDatePicker(false)}
                        >
                          <Text className="text-center text-base text-gray-600">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-[#a084e8] rounded-xl py-3"
                          onPress={confirmMilestoneDate}
                        >
                          <Text className="text-center text-base text-white font-bold">
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={newMilestoneDateObj}
                  mode="date"
                  display="default"
                  onChange={handleMilestoneDateChange}
                  textColor="#333333"
                  accentColor="#a084e8"
                />
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default OrgCreate;
