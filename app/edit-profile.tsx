import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { GlobalFacade } from "@/store/global";
import { uploadImageAsync, resolveFileUrl } from "@/lib/upload";
import { notify } from "@/lib/notify";
import { Gender } from "@/models/enums";
import { colors } from "@/theme/colors";

const GENDER_OPTIONS = [
  { value: String(Gender.Male), label: "Nam" },
  { value: String(Gender.Female), label: "Nữ" },
  { value: String(Gender.Unknown), label: "Khác" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-2 ml-1 text-sm font-medium text-muted">{label}</Text>
      {children}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, updateAvatar, isSubmitting } = GlobalFacade();
  const u = user?.userModel;

  const [name, setName] = useState(u?.name ?? "");
  const [userName, setUserName] = useState(u?.userName ?? "");
  const [email, setEmail] = useState(u?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(u?.phoneNumber ?? "");
  const [gender, setGender] = useState<Gender | undefined>(u?.gender);
  const [birthdate, setBirthdate] = useState<Date | null>(
    u?.birthdate ? new Date(u.birthdate) : null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    resolveFileUrl(u?.avatar),
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const chooseAvatarSource = () => {
    Alert.alert("Ảnh đại diện", "Chọn nguồn ảnh", [
      { text: "Chụp ảnh", onPress: () => pickAvatar("camera") },
      { text: "Chọn từ thư viện", onPress: () => pickAvatar("library") },
      { text: "Huỷ", style: "cancel" },
    ]);
  };

  const pickAvatar = async (source: "camera" | "library") => {
    let res: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        notify.error("Cần cấp quyền camera để chụp ảnh");
        return;
      }
      res = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
    } else {
      res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
    }
    if (res.canceled || !res.assets?.[0] || !u?.id) return;
    const asset = res.assets[0];
    setUploadingAvatar(true);
    try {
      const att = await uploadImageAsync({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      if (att) {
        await updateAvatar(u.id, att).unwrap();
        setAvatarUrl(resolveFileUrl(att));
      }
    } catch {
      // toast surfaced by API layer
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSave = async () => {
    if (!u?.id) return;
    if (!name.trim()) {
      notify.error("Vui lòng nhập họ tên");
      return;
    }
    try {
      await updateProfile(u.id, {
        name: name.trim(),
        userName: userName.trim() || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        gender,
        birthdate: birthdate ? birthdate.toISOString() : null,
      }).unwrap();
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="mb-2 mt-1 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-muted">Huỷ</Text>
          </Pressable>
          <Text className="text-lg font-bold text-ink">Chỉnh sửa hồ sơ</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* avatar */}
          <View className="items-center py-6">
            <Pressable onPress={chooseAvatarSource} disabled={uploadingAvatar}>
              <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.primary} />
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 112, height: 112 }} />
                ) : (
                  <Ionicons name="person" size={56} color={colors.primary} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary">
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </Pressable>
            <Text className="mt-3 text-sm text-muted">Chạm để đổi ảnh đại diện</Text>
          </View>

          <Field label="Họ và tên">
            <GlassSurface radius={16}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ tên"
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                className="h-14 px-4 text-base text-ink"
              />
            </GlassSurface>
          </Field>

          <Field label="Tên đăng nhập">
            <GlassSurface radius={16}>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Tên đăng nhập"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.primary}
                className="h-14 px-4 text-base text-ink"
              />
            </GlassSurface>
          </Field>

          <Field label="Email">
            <GlassSurface radius={16}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.primary}
                className="h-14 px-4 text-base text-ink"
              />
            </GlassSurface>
          </Field>

          <Field label="Số điện thoại">
            <GlassSurface radius={16}>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Số điện thoại"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                selectionColor={colors.primary}
                className="h-14 px-4 text-base text-ink"
              />
            </GlassSurface>
          </Field>

          <Field label="Giới tính">
            <SelectField
              placeholder="Chọn giới tính"
              title="Giới tính"
              value={gender !== undefined ? String(gender) : undefined}
              options={GENDER_OPTIONS}
              onChange={(v) => setGender(v !== undefined ? (Number(v) as Gender) : undefined)}
            />
          </Field>

          <Field label="Ngày sinh">
            {birthdate ? (
              <>
                <DateField
                  value={birthdate}
                  onChange={setBirthdate}
                  maximumDate={new Date()}
                />
                <Pressable onPress={() => setBirthdate(null)} hitSlop={8} className="mt-2">
                  <Text className="ml-1 text-xs text-expense">Xoá ngày sinh</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => setBirthdate(new Date(2000, 0, 1))}>
                <GlassSurface radius={16}>
                  <View className="h-14 flex-row items-center justify-between px-4">
                    <Text className="text-base text-muted">Chọn ngày sinh</Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.muted} />
                  </View>
                </GlassSurface>
              </Pressable>
            )}
          </Field>

          <View className="mt-8">
            <Button title="Lưu thay đổi" onPress={onSave} loading={isSubmitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
