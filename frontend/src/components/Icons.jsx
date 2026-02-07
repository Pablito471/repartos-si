/**
 * Colección de iconos usando @heroicons/react
 * Uso: <Icons.Package className="w-6 h-6" />
 */

import {
  ArchiveBoxIcon,
  TruckIcon,
  CheckCircleIcon,
  CheckIcon,
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
  EyeSlashIcon,
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
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  SparklesIcon,
  ArrowPathIcon,
  InboxIcon,
  PlayIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PrinterIcon,
  QrCodeIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  LifebuoyIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  CameraIcon,
  VideoCameraIcon,
  PhoneIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  LightBulbIcon,
  EnvelopeIcon,
  InformationCircleIcon,
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

  // Ocultar/No ver
  EyeOff: EyeSlashIcon,

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

  // Signo de interrogación
  QuestionMarkCircle: QuestionMarkCircleIcon,

  // Búsqueda/Lupa
  Search: MagnifyingGlassIcon,

  // Filtro
  Filter: FunnelIcon,

  // Impresora
  Printer: PrinterIcon,

  // Código QR
  QrCode: QrCodeIcon,

  // X Círculo (error)
  XCircle: XCircleIcon,

  // Triángulo de exclamación (alias)
  ExclamationTriangle: ExclamationTriangleIcon,

  // Enviar mensaje
  Send: PaperAirplaneIcon,

  // Soporte/Ayuda
  Support: LifebuoyIcon,

  // Chat con múltiples burbujas
  ChatMultiple: ChatBubbleLeftRightIcon,

  // Basura/Eliminar
  Trash: TrashIcon,

  // Cámara/Escáner
  Camera: CameraIcon,

  // Video
  Video: VideoCameraIcon,

  // Teléfono
  Phone: PhoneIcon,

  // Micrófono
  Microphone: MicrophoneIcon,

  // Altavoz
  Speaker: SpeakerWaveIcon,

  // Altavoz silenciado
  SpeakerOff: SpeakerXMarkIcon,

  // Chevron izquierda (volver)
  ChevronLeft: ChevronLeftIcon,

  // Chevron derecha
  ChevronRight: ChevronRightIcon,

  // Chevron arriba
  ChevronUp: ChevronUpIcon,

  // Check simple
  Check: CheckIcon,

  // Editar (alias de Pencil)
  Edit: PencilIcon,

  // Email/Correo
  Email: EnvelopeIcon,

  // Información
  Info: InformationCircleIcon,

  // Linterna/Bombilla
  LightBulb: LightBulbIcon,
};

export default Icons;
