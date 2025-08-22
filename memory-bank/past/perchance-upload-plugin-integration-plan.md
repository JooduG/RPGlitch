@ -0,0 +1,201 @@

# 🎯 Perchance Upload Plugin Integration Plan for RPGlitch Profile Pictures

## 📋 **Research Summary**

### **Plugin Capabilities:**

- **Import**: `upload = {import:upload-plugin}`
- **Basic Usage**: `let { url, size, error } = await upload(content);`
- **Content Types**: Accepts strings or Blob objects
- **Error Handling**: Returns error strings like "over_daily_allowance", "file_too_big", "invalid_filetype"
- **Temporary Files**: Can use `expires` parameter for higher limits (400x boost for 24 hours or less)
- **Manual Deletion**: Can delete files within 3 days using `deletionUrl`

### **Key Advantages:**

- ✅ **Reliable Hosting**: Files hosted on Perchance's own infrastructure
- ✅ **No External Dependencies**: No more broken CDN URLs
- ✅ **Programmatic Upload**: Can upload from code, not just manual interface
- ✅ **Error Handling**: Built-in error detection and handling
- ✅ **File Management**: Can delete files when no longer needed

## 🎯 **Integration Strategy**

### **Phase 1: Basic Integration**

1. **Add Plugin Import** to RPGlitch generator
2. **Create Upload Function** for profile pictures
3. **Update Profile Picture Logic** to use uploaded URLs
4. **Test Basic Upload/Display** functionality

### **Phase 2: Enhanced Features**

1. **Add Image Compression** for better file sizes
2. **Implement Temporary Files** for higher limits
3. **Add File Cleanup** for unused profile pictures
4. **Create Upload UI** for user-generated profile pictures

### **Phase 3: Advanced Features**

1. **Batch Upload** for multiple profile pictures
2. **Image Optimization** (resize, format conversion)
3. **Upload Progress** indicators
4. **Error Recovery** and retry mechanisms

## 🔧 **Implementation Plan**

### **Step 1: Add Plugin to RPGlitch**

```javascript
// Add to RPGlitch generator lists
upload = {import:upload-plugin}
```

### **Step 2: Create Profile Picture Upload Function**

```javascript
async function uploadProfilePicture(imageData, characterName) {
  try {
    // Convert image data to Blob
    const blob = await fetch(imageData).then(res => res.blob());
    
    // Upload with 24-hour expiry for higher limits
    const { url, size, error } = await upload(blob, {
      expires: Date.now() + 1000 * 60 * 60 * 24
    });
    
    if (error) {
      console.error(`Upload failed for ${characterName}:`, error);
      return null;
    }
    
    console.log(`Profile picture uploaded for ${characterName}:`, url);
    return url;
  } catch (err) {
    console.error(`Upload error for ${characterName}:`, err);
    return null;
  }
}
```

### **Step 3: Update Profile Picture System**

```javascript
// Update getProfilePictureHTML function
function getProfilePictureHTML(item, palette, context = 'profile', fontFamily = 'Segoe UI, system-ui, sans-serif') {
  if (!item) {
    return createFallbackProfilePicture('Unknown', palette, context, fontFamily);
  }

  const name = item.name || item.description || 'Unknown';
  const itemId = item.id || null;
  const isPremade = item.isPremade || false;
  const profilePictureUrl = item.profilePicture || null;

  // Try to load uploaded profile picture
  if (profilePictureUrl && profilePictureUrl.trim() !== '') {
    const img = document.createElement('img');
    img.src = profilePictureUrl;
    img.alt = `Profile picture for ${name}`;
    img.className = 'profile-picture';
    img.setAttribute('data-item-id', itemId);
    img.setAttribute('data-context', context);
    img.setAttribute('data-is-premade', isPremade);
    
    // Error handling for broken images
    img.onerror = function() {
      console.warn(`Failed to load profile picture for ${name}: ${profilePictureUrl}`);
      // Replace with fallback initials
      const fallback = createFallbackProfilePicture(name, palette, context, fontFamily);
      if (img.parentNode) {
        img.parentNode.replaceChild(fallback, img);
      }
    };
    
    // Success handler for debugging
    img.onload = function() {
      console.log(`Successfully loaded profile picture for ${name}: ${profilePictureUrl}`);
    };
    
    return img;
  } else {
    // No URL provided, use fallback initials
    return createFallbackProfilePicture(name, palette, context, fontFamily);
  }
}
```

### **Step 4: Create Upload UI**

```javascript
// Add upload button to character creation/editing
async function handleProfilePictureUpload(characterId, fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  
  // Show upload progress
  const progressEl = document.getElementById('upload-progress');
  progressEl.textContent = 'Uploading profile picture...';
  
  try {
    // Convert file to data URL
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    
    // Upload to Perchance
    const uploadedUrl = await uploadProfilePicture(dataUrl, characterId);
    
    if (uploadedUrl) {
      // Update character data
      updateCharacterProfilePicture(characterId, uploadedUrl);
      progressEl.textContent = 'Profile picture uploaded successfully!';
    } else {
      progressEl.textContent = 'Upload failed. Using fallback initials.';
    }
  } catch (err) {
    console.error('Upload error:', err);
    progressEl.textContent = 'Upload error. Using fallback initials.';
  }
}
```

## 📊 **Benefits for RPGlitch**

### **✅ Immediate Benefits:**

- **Reliable Images**: No more broken CDN URLs
- **Unified System**: Same logic for all profile pictures
- **Better Performance**: Images load from Perchance's fast servers
- **Error Handling**: Graceful fallback to colored initials

### **✅ Long-term Benefits:**

- **User-Generated Content**: Users can upload their own profile pictures
- **Scalable**: Can handle unlimited profile pictures
- **Cost-Effective**: No external hosting costs
- **Integrated**: Works seamlessly with Perchance ecosystem

## 🚀 **Next Steps**

1. **Implement Basic Integration** (Phase 1)
2. **Test with Sample Images**
3. **Add Upload UI** for user-generated profile pictures
4. **Optimize for Performance** and file sizes
5. **Add Advanced Features** (Phase 2 & 3)

## 📝 **Technical Notes**

### **File Size Limits:**

- **Regular**: Smaller limits, suitable for basic profile pictures
- **Temporary (24h)**: 400x higher limits, perfect for profile pictures
- **Compression**: Can use gzip compression for even higher limits

### **Error Handling:**

- **Upload Failures**: Fall back to colored initials
- **Network Issues**: Retry mechanism with exponential backoff
- **File Size**: Automatic compression for large images

### **Security:**

- **File Validation**: Check file types and sizes
- **Content Filtering**: Basic content validation
- **Access Control**: URLs are public but can be deleted

---

**🎯 This integration will solve the broken image issues and provide a robust, scalable profile picture system for RPGlitch!**
