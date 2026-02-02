import "@/styles/globals.css";
import { ClienteProvider } from "@/context/ClienteContext";
import { DepositoProvider } from "@/context/DepositoContext";
import { FleteProvider } from "@/context/FleteContext";
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ClienteProvider>
        <DepositoProvider>
          <FleteProvider>
            <Component {...pageProps} />
          </FleteProvider>
        </DepositoProvider>
      </ClienteProvider>
    </AuthProvider>
  );
}
