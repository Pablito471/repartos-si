/**
 * Colección de iconos usando @heroicons/react
 * Uso: <Icons.Package className="w-6 h-6" />
 */

import {
  ArchiveBoxIcon,
  TruckIcon,
  CheckCircleIcon,
  WalletIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  MapPinIcon,
  MapIcon,
  UserIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ExclamationTriangleIcon,
  StarIcon as StarOutlineIcon,
  ArrowRightIcon,
  EyeIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  DocumentIcon,
  ShoppingCartIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  PencilIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SparklesIcon,
  ArrowPathIcon,
  InboxIcon,
  PlayIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

import { StarIcon as StarFilledIcon } from "@heroicons/react/24/solid";

// Re-exportar con nombres más simples para compatibilidad
const Icons = {
  // Pedidos/Paquetes
  Package: ArchiveBoxIcon,

  // Camión/Envío
  Truck: TruckIcon,

  // Check/Completado
  CheckCircle: CheckCircleIcon,

  // Dinero/Billetera
  Wallet: WalletIcon,

  // Plus/Agregar
  Plus: PlusIcon,

  // Gráfico/Estadísticas
  ChartBar: ChartBarIcon,

  // Tendencia arriba
  TrendingUp: ArrowTrendingUpIcon,

  // Tendencia abajo
  TrendingDown: ArrowTrendingDownIcon,

  // Reloj/Tiempo
  Clock: ClockIcon,

  // Mapa/Ruta
  MapPin: MapPinIcon,

  // Mapa de ruta
  Map: MapIcon,

  // Usuario
  User: UserIcon,

  // Usuarios múltiples
  Users: UsersIcon,

  // Edificio/Depósito
  Building: BuildingOffice2Icon,

  // Inventario/Lista
  ClipboardList: ClipboardDocumentListIcon,

  // Notificación/Campana
  Bell: BellIcon,

  // Configuración/Engranaje
  Cog: Cog6ToothIcon,

  // Salir/Logout
  Logout: ArrowRightStartOnRectangleIcon,

  // Alerta/Advertencia
  Alert: ExclamationTriangleIcon,

  // Estrella (outline)
  Star: StarOutlineIcon,

  // Estrella llena
  StarFilled: StarFilledIcon,

  // Flecha derecha
  ArrowRight: ArrowRightIcon,

  // Ojo/Ver
  Eye: EyeIcon,

  // Prohibido/Desactivado
  Ban: NoSymbolIcon,

  // Escudo/Seguridad
  Shield: ShieldCheckIcon,

  // Candado
  Lock: LockClosedIcon,

  // Documento
  Document: DocumentIcon,

  // Carro de compras
  ShoppingCart: ShoppingCartIcon,

  // Comentario/Chat
  Chat: ChatBubbleLeftIcon,

  // Calendario
  Calendar: CalendarIcon,

  // Moneda/Dinero
  Currency: CurrencyDollarIcon,

  // Billetes
  Banknotes: BanknotesIcon,

  // Porcentaje
  Percent: ReceiptPercentIcon,

  // Home
  Home: HomeIcon,

  // Editar/Lápiz
  Pencil: PencilIcon,

  // Menú hamburguesa
  Menu: Bars3Icon,

  // X/Cerrar
  X: XMarkIcon,

  // Chevron abajo
  ChevronDown: ChevronDownIcon,

  // Celebración/Éxito
  Sparkles: SparklesIcon,

  // Refresh
  Refresh: ArrowPathIcon,

  // Inbox/Bandeja
  Inbox: InboxIcon,

  // Play
  Play: PlayIcon,
};

export default Icons;
