import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

export default function CaptureScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Get user on mount
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow microphone access')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
    } catch (err: any) {
      Alert.alert('Error', 'Failed to start recording: ' + err.message)
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    try {
      setUploading(true)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()

      if (uri) {
        await uploadCapture(uri, 'voice')
      }

      setRecording(null)
    } catch (err: any) {
      Alert.alert('Error', 'Failed to stop recording: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow camera access')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setUploading(true)
        await uploadCapture(result.assets[0].uri, 'photo')
        setUploading(false)
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to take photo: ' + err.message)
      setUploading(false)
    }
  }

  const recordVideo = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow camera access')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 120, // 2 minutes max
      })

      if (!result.canceled && result.assets[0]) {
        setUploading(true)
        await uploadCapture(result.assets[0].uri, 'video')
        setUploading(false)
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to record video: ' + err.message)
      setUploading(false)
    }
  }

  const uploadCapture = async (uri: string, type: 'voice' | 'photo' | 'video') => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Read file as base64
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) throw new Error('File not found')

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Determine file extension
      let ext = 'dat'
      if (type === 'voice') ext = 'm4a'
      if (type === 'photo') ext = 'jpg'
      if (type === 'video') ext = 'mp4'

      const fileName = `${user.id}/${Date.now()}.${ext}`
      const bucketName = type === 'voice' ? 'voice-notes' : type === 'photo' ? 'photos' : 'videos'

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, Buffer.from(base64, 'base64'), {
          contentType: type === 'voice' ? 'audio/m4a' : type === 'photo' ? 'image/jpeg' : 'video/mp4',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName)

      // Create capture record
      const { error: insertError } = await supabase.from('captures').insert({
        user_id: user.id,
        type,
        file_url: publicUrl,
        processing_status: 'pending',
      })

      if (insertError) throw insertError

      Alert.alert('Success', 'Captured! Processing will begin shortly.')
    } catch (err: any) {
      Alert.alert('Upload Error', err.message)
      throw err
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ki</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Quick Capture</Text>

        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.captureButton, styles.voiceButton, (recording || uploading) && styles.buttonDisabled]}
            onPress={recording ? stopRecording : startRecording}
            disabled={uploading}
          >
            <Text style={styles.captureButtonIcon}>
              {recording ? '⏹️' : '🎤'}
            </Text>
            <Text style={styles.captureButtonText}>
              {recording ? 'Stop Recording' : 'Record Voice'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, styles.photoButton, (recording || uploading) && styles.buttonDisabled]}
            onPress={takePhoto}
            disabled={recording || uploading}
          >
            <Text style={styles.captureButtonIcon}>📷</Text>
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, styles.videoButton, (recording || uploading) && styles.buttonDisabled]}
            onPress={recordVideo}
            disabled={recording || uploading}
          >
            <Text style={styles.captureButtonIcon}>🎥</Text>
            <Text style={styles.captureButtonText}>Record Video</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Captures will be processed automatically and appear in your Pensieve on the web app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  signOutText: {
    color: '#2563eb',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  buttonsContainer: {
    gap: 16,
  },
  captureButton: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  voiceButton: {
    backgroundColor: '#3b82f6',
  },
  photoButton: {
    backgroundColor: '#10b981',
  },
  videoButton: {
    backgroundColor: '#8b5cf6',
  },
  captureButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoText: {
    color: '#1e40af',
    fontSize: 14,
    lineHeight: 20,
  },
})
