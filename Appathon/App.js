import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signUp, signIn, onAuthStateChange } from "./services/authService";
import { saveUserProfile, saveQuizData, createNote } from "./services/firestoreService";

import SignupScreen1 from "./screens/SignupScreen1";
import SignupScreen2 from "./screens/SignupScreen2";
import SignupScreen3 from "./screens/SignupScreen3";
import SignInScreen from "./screens/SignInScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfileScreen from "./screens/ProfileScreen";
import WeekInReviewScreen from "./screens/WeekInReviewScreen";
import LoadingScreen from "./screens/LoadingScreen";
import SummaryScreen from "./screens/SummaryScreen";
import SuccessScreen from "./screens/SuccessScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import QuizScreen1 from "./screens/QuizScreen1";
import QuizScreen2 from "./screens/QuizScreen2";
import QuizScreen3 from "./screens/QuizScreen3";
import QuizScreen4 from "./screens/QuizScreen4";
import QuizScreen5 from "./screens/QuizScreen5";
import TabBar from "./components/TabBar";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function MainApp() {
  const { theme, isDarkMode } = useTheme();

  // stack navigation state
  const [screen, setScreen] = useState("loading");
  const [previousScreen, setPreviousScreen] = useState("loading");

  // Signup data state
  const [signupData, setSignupData] = useState({});

  // Quiz data state
  const [quizData, setQuizData] = useState({});

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewSignup, setIsNewSignup] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('home');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user && !isNewSignup) {
        // Existing user is signed in, navigate to home
        if (screen === "loading") {
          setTimeout(() => {
            navigateWithAnimation("home");
          }, 1500);
        }
      } else if (!user) {
        // User is signed out, navigate to onboarding
        if (screen === "loading") {
          setTimeout(() => {
            navigateWithAnimation("onboarding");
          }, 1500);
        }
      }
    });

    return () => unsubscribe();
  }, [isNewSignup]);

  // Auto-navigate from loading screen if no user
  useEffect(() => {
    if (screen === "loading" && !loading && !currentUser) {
      const timer = setTimeout(() => {
        navigateWithAnimation("onboarding");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [screen, loading, currentUser]);

  // Animated navigation function
  const navigateWithAnimation = (targetScreen, animationType = "fade") => {
    setPreviousScreen(screen);

    if (animationType === "modal") {
      // Slide from bottom for modal-like screens
      slideAnim.setValue(1000);
      setScreen(targetScreen);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      // Fade transition for regular screens
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setScreen(targetScreen);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const goBack = () => {
    navigateWithAnimation(previousScreen);
  };

  const handleGetStarted = () => {
    navigateWithAnimation("signup1");
  };

  const handleSignInFromOnboarding = () => {
    navigateWithAnimation("signin");
  };

  const handleSignupStep1Next = (data) => {
    setSignupData({ ...signupData, ...data });
    navigateWithAnimation("signup2");
  };

  const handleSignupStep2Next = (data) => {
    setSignupData({ ...signupData, ...data });
    navigateWithAnimation("signup3");
  };

  const handleSignupStep3Next = async (data) => {
    const fullSignupData = { ...signupData, ...data };
    setSignupData(fullSignupData);

    // Mark as new signup to prevent auto-navigation to home
    setIsNewSignup(true);

    // Create Firebase account
    const result = await signUp(fullSignupData.email, fullSignupData.password);

    if (result.success) {
      // Save user profile to Firestore
      await saveUserProfile(result.user.uid, {
        name: fullSignupData.name,
        email: fullSignupData.email,
        createdAt: new Date().toISOString()
      });

      // Navigate to quiz
      navigateWithAnimation("quiz1");
    } else {
      Alert.alert("Signup Error", result.error);
      setIsNewSignup(false);
    }
  };

  const handleSignIn = async (email, password) => {
    const result = await signIn(email, password);

    if (result.success) {
      navigateWithAnimation("home");
    } else {
      Alert.alert("Sign In Error", result.error);
    }
  };

  const handleQuizStep1Next = (data) => {
    setQuizData({ ...quizData, ...data });
    navigateWithAnimation("quiz2");
  };

  const handleQuizStep2Next = (data) => {
    setQuizData({ ...quizData, ...data });
    navigateWithAnimation("quiz3");
  };

  const handleQuizStep3Next = (data) => {
    setQuizData({ ...quizData, ...data });
    navigateWithAnimation("quiz4");
  };

  const handleQuizStep4Next = (data) => {
    setQuizData({ ...quizData, ...data });
    navigateWithAnimation("quiz5");
  };

  const handleQuizStep5Next = async (data) => {
    const fullQuizData = { ...quizData, ...data };
    setQuizData(fullQuizData);

    // Save quiz data to Firestore
    if (currentUser) {
      const result = await saveQuizData(currentUser.uid, fullQuizData);

      if (result.success) {
        console.log("Quiz data saved successfully");
      } else {
        console.error("Error saving quiz data:", result.error);
      }
    }

    // Reset new signup flag
    setIsNewSignup(false);

    navigateWithAnimation("home");
  };

  const navigateToNote = () => {
    navigateWithAnimation("createNote");
  };

  const navigateToChat = () => {
    setActiveTab('chat');
  };

  const navigateToProfile = () => {
    navigateWithAnimation("profile");
  };

  const navigateToSummary = () => {
    navigateWithAnimation("summary");
  };

  const navigateToHome = () => {
    navigateWithAnimation("home");
  };

  const navigateToSuccess = async (noteText) => {
    // Save note to Firestore
    if (currentUser) {
      const result = await createNote(currentUser.uid, {
        content: noteText,
        mood: 'neutral', // You can enhance this later with mood detection
      });

      if (result.success) {
        console.log("Note saved successfully:", result.noteId);
      } else {
        console.error("Error saving note:", result.error);
      }
    }

    navigateWithAnimation("success");
  };

  // Loading screen
  if (screen === "loading") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
          <LoadingScreen />
        </SafeAreaView>
      </View>
    );
  }

  // Home screen (Dashboard) with Tabs
  if (screen === "home") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: theme.cardBackground }]}>
        <Animated.View
          style={[styles.animatedContainer, { opacity: fadeAnim }]}
        >
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.cardBackground }]}
          >
            {activeTab === 'home' ? (
              <HistoryScreen
                onCreateNote={navigateToNote}
                onViewSummary={navigateToSummary}
                onStartChat={navigateToChat}
                onEditProfile={navigateToProfile}
                currentUser={currentUser}
              />
            ) : (
              <ChatScreen onBack={() => setActiveTab('home')} onFinish={navigateToSuccess} />
            )}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Create Note screen
  if (screen === "createNote") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View
          style={[styles.animatedContainer, { opacity: fadeAnim }]}
        >
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <NoteScreen onBack={navigateToHome} onFinish={navigateToSuccess} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }


  // Profile screen
  if (screen === "profile") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View
          style={[styles.animatedContainer, { opacity: fadeAnim }]}
        >
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <ProfileScreen onBack={navigateToHome} currentUser={currentUser} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Success screen
  if (screen === "success") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View
          style={[styles.animatedContainer, { opacity: fadeAnim }]}
        >
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <SuccessScreen onComplete={navigateToHome} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Summary screen
  if (screen === "summary") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View
          style={[styles.animatedContainer, { opacity: fadeAnim }]}
        >
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <SummaryScreen onBack={navigateToHome} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Onboarding screen
  if (screen === "onboarding") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <OnboardingScreen
              onGetStarted={handleGetStarted}
              onSignIn={handleSignInFromOnboarding}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Sign In screen
  if (screen === "signin") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <SignInScreen
              onBack={goBack}
              onSignIn={(email, password) => handleSignIn(email, password)}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Signup Step 1
  if (screen === "signup1") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <SignupScreen1
              onBack={goBack}
              onNext={handleSignupStep1Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Signup Step 2
  if (screen === "signup2") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <SignupScreen2
              onBack={goBack}
              onNext={handleSignupStep2Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Signup Step 3
  if (screen === "signup3") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <SignupScreen3
              onBack={goBack}
              onNext={handleSignupStep3Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Quiz Step 1
  if (screen === "quiz1") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <QuizScreen1
              onBack={goBack}
              onNext={handleQuizStep1Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Quiz Step 2
  if (screen === "quiz2") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <QuizScreen2
              onBack={goBack}
              onNext={handleQuizStep2Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Quiz Step 3
  if (screen === "quiz3") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <QuizScreen3
              onBack={goBack}
              onNext={handleQuizStep3Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Quiz Step 4
  if (screen === "quiz4") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <QuizScreen4
              onBack={goBack}
              onNext={handleQuizStep4Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Quiz Step 5
  if (screen === "quiz5") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
          >
            <QuizScreen5
              onBack={goBack}
              onNext={handleQuizStep5Next}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Fallback for any other screens
  return (
    <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
          <View style={[styles.container, { backgroundColor: theme.background }]} />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  nextBtn: {
    padding: 14,
    borderRadius: 12,
    margin: 20,
    alignSelf: "center",
  },
  nextText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
});
