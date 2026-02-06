import "@/styles/globals.css";
import { ClienteProvider } from "@/context/ClienteContext";
import { DepositoProvider } from "@/context/DepositoContext";
import { FleteProvider } from "@/context/FleteContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ChatProvider } from "@/context/ChatContext";
import { NotificacionProvider } from "@/context/NotificacionContext";
import ChatWidget from "@/components/ChatWidget";
import AdminChatWidget from "@/components/AdminChatWidget";
import VideollamadaEntranteModal from "@/components/VideollamadaEntranteModal";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificacionProvider>
          <ChatProvider>
            <ClienteProvider>
              <DepositoProvider>
                <FleteProvider>
                  <Component {...pageProps} />
                  <ChatWidget />
                  <AdminChatWidget />
                  <VideollamadaEntranteModal />
                </FleteProvider>
              </DepositoProvider>
            </ClienteProvider>
          </ChatProvider>
        </NotificacionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
