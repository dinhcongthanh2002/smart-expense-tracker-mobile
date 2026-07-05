import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";

import { TransactionRow } from "./TransactionRow";
import { colors } from "@/theme/colors";
import type { TransactionViewModel } from "@/store/transaction/model";

interface Props {
  tx: TransactionViewModel;
  onEdit: () => void;
  onDelete: () => void;
}

/** Transaction card with swipe-left actions: Sửa + Xoá. */
export function SwipeableTransactionRow({ tx, onEdit, onDelete }: Props) {
  const confirmDelete = () => {
    Alert.alert("Xoá giao dịch", "Bạn chắc chắn muốn xoá giao dịch này?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: onDelete },
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
            <Text className="mt-1 text-xs font-semibold text-white">Sửa</Text>
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            className="ml-2 w-[62px] items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.expense }}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text className="mt-1 text-xs font-semibold text-white">Xoá</Text>
          </Pressable>
        </View>
      )}
    >
      <View
        className="px-3"
        style={{
          borderRadius: 18,
          backgroundColor: "#171E36",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <TransactionRow tx={tx} onPress={onEdit} />
      </View>
    </ReanimatedSwipeable>
  );
}
