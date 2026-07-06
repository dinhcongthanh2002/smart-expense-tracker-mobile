import { Text } from "react-native";

/**
 * Inline validation message shown beneath a form field, matching the error text
 * rendered by the `Input` component (used on the sign-in screen). Renders nothing
 * when there is no error.
 */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <Text className="mt-1.5 ml-1 text-xs text-expense">{error}</Text>;
}
