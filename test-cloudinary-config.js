#!/usr/bin/env node

/**
 * Cloudinary Configuration Test
 * 
 * This script verifies:
 * 1. Environment variables are loaded correctly
 * 2. No API secrets are exposed in client code
 * 3. Configuration is secure
 * 4. Required values are present
 */

console.log('\n🔍 Testing Cloudinary Configuration...\n');

// Test 1: Import configuration
console.log('Test 1: Loading configuration...');
try {
  const { cloudinaryConfig } = require('./cloudinaryConfig');
  console.log('✅ Configuration loaded successfully\n');
  
  // Test 2: Check required fields
  console.log('Test 2: Checking required fields...');
  console.log('  Cloud Name:', cloudinaryConfig.cloudName || '❌ MISSING');
  console.log('  Upload Preset:', cloudinaryConfig.uploadPreset || '❌ MISSING');
  
  // Test 3: Security check - API secrets should NOT be present
  console.log('\nTest 3: Security check...');
  if (cloudinaryConfig.apiKey) {
    console.log('  ⚠️  WARNING: API Key found in config (should not be in client code)');
  } else {
    console.log('  ✅ API Key: Not present (secure)');
  }
  
  if (cloudinaryConfig.apiSecret) {
    console.log('  ⚠️  WARNING: API Secret found in config (SECURITY RISK!)');
  } else {
    console.log('  ✅ API Secret: Not present (secure)');
  }
  
  // Test 4: Check for placeholder values
  console.log('\nTest 4: Checking for placeholder values...');
  const hasPlaceholders = 
    cloudinaryConfig.cloudName === 'your-cloud-name' ||
    cloudinaryConfig.uploadPreset === 'unsigned_preset' ||
    cloudinaryConfig.uploadPreset === 'your-preset';
  
  if (hasPlaceholders) {
    console.log('  ⚠️  WARNING: Placeholder values detected');
    console.log('  📝 Action required: Update .env file with actual values');
  } else {
    console.log('  ✅ No placeholder values (good)');
  }
  
  // Test 5: Validate cloud name format
  console.log('\nTest 5: Validating cloud name format...');
  if (cloudinaryConfig.cloudName && cloudinaryConfig.cloudName !== 'your-cloud-name') {
    const isValidFormat = /^[a-z0-9_-]+$/i.test(cloudinaryConfig.cloudName);
    if (isValidFormat) {
      console.log('  ✅ Cloud name format is valid');
    } else {
      console.log('  ❌ Cloud name format is invalid (should be alphanumeric)');
    }
  } else {
    console.log('  ⚠️  Cloud name not set');
  }
  
  // Test 6: Check environment variables
  console.log('\nTest 6: Checking environment variables...');
  console.log('  EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set');
  console.log('  EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET:', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ? '✅ Set' : '❌ Not set');
  
  // Security warnings
  if (process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY) {
    console.log('  🚨 SECURITY RISK: EXPO_PUBLIC_CLOUDINARY_API_KEY is set!');
    console.log('     Remove this from .env immediately!');
  } else {
    console.log('  ✅ EXPO_PUBLIC_CLOUDINARY_API_KEY: Not set (secure)');
  }
  
  if (process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET) {
    console.log('  🚨 CRITICAL SECURITY RISK: EXPO_PUBLIC_CLOUDINARY_API_SECRET is set!');
    console.log('     Remove this from .env immediately!');
  } else {
    console.log('  ✅ EXPO_PUBLIC_CLOUDINARY_API_SECRET: Not set (secure)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('CONFIGURATION SUMMARY');
  console.log('='.repeat(60));
  
  const isSecure = !cloudinaryConfig.apiKey && !cloudinaryConfig.apiSecret &&
                   !process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY &&
                   !process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;
  
  const isConfigured = cloudinaryConfig.cloudName && 
                       cloudinaryConfig.cloudName !== 'your-cloud-name' &&
                       cloudinaryConfig.uploadPreset &&
                       cloudinaryConfig.uploadPreset !== 'unsigned_preset';
  
  if (isSecure && isConfigured) {
    console.log('✅ SECURE: No API secrets exposed');
    console.log('✅ CONFIGURED: Cloud name and preset are set');
    console.log('✅ READY: Configuration is ready for use');
  } else if (isSecure && !isConfigured) {
    console.log('✅ SECURE: No API secrets exposed');
    console.log('⚠️  NOT CONFIGURED: Update .env with actual values');
    console.log('📝 ACTION: Create .env file with cloud name and preset');
  } else if (!isSecure) {
    console.log('🚨 INSECURE: API secrets are exposed!');
    console.log('❌ CRITICAL: Remove API key/secret from .env');
    console.log('📖 READ: URGENT_ACTION_REQUIRED.md for instructions');
  }
  
  console.log('='.repeat(60));
  
  // Test 7: Test upload service import
  console.log('\nTest 7: Testing upload service...');
  try {
    const uploadService = require('./services/cloudinaryUploadService');
    console.log('  ✅ Upload service imported successfully');
    console.log('  ✅ Available functions:', Object.keys(uploadService).length);
  } catch (err) {
    console.log('  ❌ Error importing upload service:', err.message);
  }
  
  console.log('\n✅ Configuration test complete!\n');
  
  // Exit with appropriate code
  if (!isSecure) {
    console.log('⚠️  Exiting with error code due to security issues\n');
    process.exit(1);
  } else if (!isConfigured) {
    console.log('⚠️  Configuration incomplete but secure\n');
    process.exit(0);
  } else {
    console.log('✅ All checks passed!\n');
    process.exit(0);
  }
  
} catch (error) {
  console.log('❌ Error loading configuration:', error.message);
  console.log('\n📋 Troubleshooting:');
  console.log('  1. Make sure cloudinaryConfig.js exists');
  console.log('  2. Check for syntax errors in the file');
  console.log('  3. Verify Node.js modules are installed');
  console.log('\n');
  process.exit(1);
}

