import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import type { TransactionViewModel } from "@/store/transaction/model";
import { colors } from "@/theme/colors";
import { TransactionRow } from "./TransactionRow";

interface Props {
  tx: TransactionViewModel;
  onEdit: () => void;
  onDelete: () => void;
}

/** Transaction card with swipe-left actions: edit + delete. */
export function SwipeableTransactionRow({ tx, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const confirmDelete = () => {
    Alert.alert(t("transactions.deleteTitle"), t("transactions.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <View className="flex-row items-stretch pl-2">
          <Pressable
            onPress={onEdit}
            className="w-[62px] items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text className="mt-1 text-xs font-semibold text-white">{t("common.edit")}</Text>
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            className="ml-2 w-[62px] items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.expense }}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text className="mt-1 text-xs font-semibold text-white">{t("common.delete")}</Text>
          </Pressable>
        </View>
      )}
    >
      <View
        className="px-3"
        style={{
          borderRadius: 18,
          backgroundColor: colors.glassSurface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassBorder,
          overflow: "hidden",
        }}
      >
        <TransactionRow tx={tx} onPress={onEdit} />
      </View>
    </ReanimatedSwipeable>
  );
}
