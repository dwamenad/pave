import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#0284c7" />
      <Text style={{ marginTop: 8, color: "#64748b" }}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", padding: 12 }}>
      <Text style={{ color: "#991b1b", fontWeight: "600" }}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 10,
            alignSelf: "flex-start",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#fca5a5",
            paddingHorizontal: 10,
            paddingVertical: 6
          }}
        >
          <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#fff",
        padding: 16
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>{title}</Text>
      {subtitle ? <Text style={{ marginTop: 4, color: "#64748b" }}>{subtitle}</Text> : null}
    </View>
  );
}
