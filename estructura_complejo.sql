--
-- PostgreSQL database dump
--

\restrict qQjRz01BQk4vOmPGXQcb2qS8UA5x4WqhLO9f1Z9DkR2lOFIWxIsjYh4hJnYmDOX

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: clasico_bd; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA clasico_bd;


ALTER SCHEMA clasico_bd OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cajas; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.cajas (
    id integer NOT NULL,
    fecha_apertura timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_cierre timestamp without time zone,
    saldo_inicial numeric(10,2) DEFAULT 0,
    saldo_final numeric(10,2),
    estado character varying(20) DEFAULT 'abierta'::character varying,
    usuario_apertura_id integer,
    usuario_cierre_id integer,
    observaciones text
);


ALTER TABLE clasico_bd.cajas OWNER TO postgres;

--
-- Name: cajas_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.cajas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.cajas_id_seq OWNER TO postgres;

--
-- Name: cajas_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.cajas_id_seq OWNED BY clasico_bd.cajas.id;


--
-- Name: canchas; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.canchas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL
);


ALTER TABLE clasico_bd.canchas OWNER TO postgres;

--
-- Name: canchas_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.canchas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.canchas_id_seq OWNER TO postgres;

--
-- Name: canchas_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.canchas_id_seq OWNED BY clasico_bd.canchas.id;


--
-- Name: categorias; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.categorias (
    id integer NOT NULL,
    descripcion character varying(50) NOT NULL
);


ALTER TABLE clasico_bd.categorias OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.categorias_id_seq OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.categorias_id_seq OWNED BY clasico_bd.categorias.id;


--
-- Name: compras; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.compras (
    id integer NOT NULL,
    proveedor_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) DEFAULT 0,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    observaciones text
);


ALTER TABLE clasico_bd.compras OWNER TO postgres;

--
-- Name: compras_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.compras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.compras_id_seq OWNER TO postgres;

--
-- Name: compras_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.compras_id_seq OWNED BY clasico_bd.compras.id;


--
-- Name: configuracion; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.configuracion (
    clave character varying(50) NOT NULL,
    valor character varying(255) NOT NULL
);


ALTER TABLE clasico_bd.configuracion OWNER TO postgres;

--
-- Name: detalle_compra; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.detalle_compra (
    id integer NOT NULL,
    compra_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    costo_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE clasico_bd.detalle_compra OWNER TO postgres;

--
-- Name: detalle_compra_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.detalle_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.detalle_compra_id_seq OWNER TO postgres;

--
-- Name: detalle_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.detalle_compra_id_seq OWNED BY clasico_bd.detalle_compra.id;


--
-- Name: detalle_venta_cantina; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.detalle_venta_cantina (
    id integer NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE clasico_bd.detalle_venta_cantina OWNER TO postgres;

--
-- Name: detalle_venta_cantina_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.detalle_venta_cantina_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.detalle_venta_cantina_id_seq OWNER TO postgres;

--
-- Name: detalle_venta_cantina_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.detalle_venta_cantina_id_seq OWNED BY clasico_bd.detalle_venta_cantina.id;


--
-- Name: detalle_ventas; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.detalle_ventas (
    id integer NOT NULL,
    venta_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL
);


ALTER TABLE clasico_bd.detalle_ventas OWNER TO postgres;

--
-- Name: detalle_ventas_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.detalle_ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.detalle_ventas_id_seq OWNER TO postgres;

--
-- Name: detalle_ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.detalle_ventas_id_seq OWNED BY clasico_bd.detalle_ventas.id;


--
-- Name: gastos; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.gastos (
    id integer NOT NULL,
    descripcion text NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    caja_id integer,
    usuario_id integer
);


ALTER TABLE clasico_bd.gastos OWNER TO postgres;

--
-- Name: gastos_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.gastos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.gastos_id_seq OWNER TO postgres;

--
-- Name: gastos_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.gastos_id_seq OWNED BY clasico_bd.gastos.id;


--
-- Name: inscripciones; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.inscripciones (
    id integer NOT NULL,
    torneo_id integer NOT NULL,
    jugador_id integer NOT NULL,
    fecha_inscripcion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pagado boolean DEFAULT false,
    monto_abonado numeric(10,2) DEFAULT 0,
    fecha_pago timestamp without time zone,
    metodo_pago character varying(50),
    caja_id integer,
    estado character varying(20) DEFAULT 'inscripto'::character varying
);


ALTER TABLE clasico_bd.inscripciones OWNER TO postgres;

--
-- Name: inscripciones_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.inscripciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.inscripciones_id_seq OWNER TO postgres;

--
-- Name: inscripciones_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.inscripciones_id_seq OWNED BY clasico_bd.inscripciones.id;


--
-- Name: jugadores; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.jugadores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    telefono character varying(50),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    categoria_id integer
);


ALTER TABLE clasico_bd.jugadores OWNER TO postgres;

--
-- Name: jugadores_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.jugadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.jugadores_id_seq OWNER TO postgres;

--
-- Name: jugadores_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.jugadores_id_seq OWNED BY clasico_bd.jugadores.id;


--
-- Name: movimientos_cuenta; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.movimientos_cuenta (
    id integer NOT NULL,
    jugador_id integer,
    tipo character varying(10) NOT NULL,
    monto numeric(10,2) NOT NULL,
    descripcion text,
    referencia_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    caja_id integer,
    metodo_pago character varying(50),
    CONSTRAINT movimientos_cuenta_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['DEBE'::character varying, 'HABER'::character varying])::text[])))
);


ALTER TABLE clasico_bd.movimientos_cuenta OWNER TO postgres;

--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.movimientos_cuenta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.movimientos_cuenta_id_seq OWNER TO postgres;

--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.movimientos_cuenta_id_seq OWNED BY clasico_bd.movimientos_cuenta.id;


--
-- Name: movimientos_proveedor; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.movimientos_proveedor (
    id integer NOT NULL,
    proveedor_id integer,
    tipo character varying(10) NOT NULL,
    monto numeric(10,2) NOT NULL,
    descripcion text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_proveedor_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['DEBE'::character varying, 'HABER'::character varying])::text[])))
);


ALTER TABLE clasico_bd.movimientos_proveedor OWNER TO postgres;

--
-- Name: movimientos_proveedor_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.movimientos_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.movimientos_proveedor_id_seq OWNER TO postgres;

--
-- Name: movimientos_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.movimientos_proveedor_id_seq OWNED BY clasico_bd.movimientos_proveedor.id;


--
-- Name: pagos; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.pagos (
    id integer NOT NULL,
    turno_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo character varying(50) NOT NULL,
    fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    caja_id integer,
    observaciones text
);


ALTER TABLE clasico_bd.pagos OWNER TO postgres;

--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.pagos_id_seq OWNER TO postgres;

--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.pagos_id_seq OWNED BY clasico_bd.pagos.id;


--
-- Name: pagos_inscripcion; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.pagos_inscripcion (
    id integer NOT NULL,
    inscripcion_id integer,
    metodo character varying(50) NOT NULL,
    monto numeric(12,2) NOT NULL,
    caja_id integer,
    fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE clasico_bd.pagos_inscripcion OWNER TO postgres;

--
-- Name: pagos_inscripcion_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.pagos_inscripcion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.pagos_inscripcion_id_seq OWNER TO postgres;

--
-- Name: pagos_inscripcion_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.pagos_inscripcion_id_seq OWNED BY clasico_bd.pagos_inscripcion.id;


--
-- Name: pagos_ventas; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.pagos_ventas (
    id integer NOT NULL,
    venta_id integer,
    metodo character varying(50) NOT NULL,
    monto numeric(12,2) NOT NULL,
    referencia character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE clasico_bd.pagos_ventas OWNER TO postgres;

--
-- Name: pagos_ventas_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.pagos_ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.pagos_ventas_id_seq OWNER TO postgres;

--
-- Name: pagos_ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.pagos_ventas_id_seq OWNED BY clasico_bd.pagos_ventas.id;


--
-- Name: productos; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.productos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    categoria character varying(50),
    precio numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    stock_minimo integer DEFAULT 0,
    precio_venta numeric(10,2),
    costo numeric(10,2),
    proveedor_id integer,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying,
    codigo_barra character varying(100)
);


ALTER TABLE clasico_bd.productos OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.productos_id_seq OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.productos_id_seq OWNED BY clasico_bd.productos.id;


--
-- Name: proveedores; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.proveedores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    contacto character varying(100),
    telefono character varying(50),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE clasico_bd.proveedores OWNER TO postgres;

--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.proveedores_id_seq OWNER TO postgres;

--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.proveedores_id_seq OWNED BY clasico_bd.proveedores.id;


--
-- Name: reservas_fijas; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.reservas_fijas (
    id integer NOT NULL,
    cancha_id integer NOT NULL,
    dia_semana integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    cliente_nombre character varying(100) NOT NULL,
    cliente_telefono character varying(50),
    monto_total numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reservas_fijas_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


ALTER TABLE clasico_bd.reservas_fijas OWNER TO postgres;

--
-- Name: reservas_fijas_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.reservas_fijas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.reservas_fijas_id_seq OWNER TO postgres;

--
-- Name: reservas_fijas_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.reservas_fijas_id_seq OWNED BY clasico_bd.reservas_fijas.id;


--
-- Name: torneos; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.torneos (
    id integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    fecha_inicio date NOT NULL,
    costo_inscripcion numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE clasico_bd.torneos OWNER TO postgres;

--
-- Name: torneos_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.torneos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.torneos_id_seq OWNER TO postgres;

--
-- Name: torneos_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.torneos_id_seq OWNED BY clasico_bd.torneos.id;


--
-- Name: turnos; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.turnos (
    id integer NOT NULL,
    cancha_id integer NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    cliente_nombre character varying(100) NOT NULL,
    cliente_telefono character varying(50),
    estado character varying(20) DEFAULT 'reservado'::character varying,
    pagado boolean DEFAULT false,
    monto_total numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT turnos_estado_check CHECK (((estado)::text = ANY ((ARRAY['reservado'::character varying, 'confirmado'::character varying, 'cancelado'::character varying, 'jugado'::character varying])::text[])))
);


ALTER TABLE clasico_bd.turnos OWNER TO postgres;

--
-- Name: turnos_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.turnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.turnos_id_seq OWNER TO postgres;

--
-- Name: turnos_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.turnos_id_seq OWNED BY clasico_bd.turnos.id;


--
-- Name: usuarios; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.usuarios (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    rol character varying(20) DEFAULT 'user'::character varying
);


ALTER TABLE clasico_bd.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.usuarios_id_seq OWNED BY clasico_bd.usuarios.id;


--
-- Name: ventas; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.ventas (
    id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL
);


ALTER TABLE clasico_bd.ventas OWNER TO postgres;

--
-- Name: ventas_cantina; Type: TABLE; Schema: clasico_bd; Owner: postgres
--

CREATE TABLE clasico_bd.ventas_cantina (
    id integer NOT NULL,
    turno_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL,
    metodo_pago character varying(50),
    caja_id integer,
    observaciones text
);


ALTER TABLE clasico_bd.ventas_cantina OWNER TO postgres;

--
-- Name: ventas_cantina_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.ventas_cantina_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.ventas_cantina_id_seq OWNER TO postgres;

--
-- Name: ventas_cantina_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.ventas_cantina_id_seq OWNED BY clasico_bd.ventas_cantina.id;


--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: clasico_bd; Owner: postgres
--

CREATE SEQUENCE clasico_bd.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE clasico_bd.ventas_id_seq OWNER TO postgres;

--
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: clasico_bd; Owner: postgres
--

ALTER SEQUENCE clasico_bd.ventas_id_seq OWNED BY clasico_bd.ventas.id;


--
-- Name: cajas id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.cajas ALTER COLUMN id SET DEFAULT nextval('clasico_bd.cajas_id_seq'::regclass);


--
-- Name: canchas id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.canchas ALTER COLUMN id SET DEFAULT nextval('clasico_bd.canchas_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.categorias ALTER COLUMN id SET DEFAULT nextval('clasico_bd.categorias_id_seq'::regclass);


--
-- Name: compras id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.compras ALTER COLUMN id SET DEFAULT nextval('clasico_bd.compras_id_seq'::regclass);


--
-- Name: detalle_compra id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_compra ALTER COLUMN id SET DEFAULT nextval('clasico_bd.detalle_compra_id_seq'::regclass);


--
-- Name: detalle_venta_cantina id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_venta_cantina ALTER COLUMN id SET DEFAULT nextval('clasico_bd.detalle_venta_cantina_id_seq'::regclass);


--
-- Name: detalle_ventas id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_ventas ALTER COLUMN id SET DEFAULT nextval('clasico_bd.detalle_ventas_id_seq'::regclass);


--
-- Name: gastos id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.gastos ALTER COLUMN id SET DEFAULT nextval('clasico_bd.gastos_id_seq'::regclass);


--
-- Name: inscripciones id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.inscripciones ALTER COLUMN id SET DEFAULT nextval('clasico_bd.inscripciones_id_seq'::regclass);


--
-- Name: jugadores id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.jugadores ALTER COLUMN id SET DEFAULT nextval('clasico_bd.jugadores_id_seq'::regclass);


--
-- Name: movimientos_cuenta id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_cuenta ALTER COLUMN id SET DEFAULT nextval('clasico_bd.movimientos_cuenta_id_seq'::regclass);


--
-- Name: movimientos_proveedor id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_proveedor ALTER COLUMN id SET DEFAULT nextval('clasico_bd.movimientos_proveedor_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos ALTER COLUMN id SET DEFAULT nextval('clasico_bd.pagos_id_seq'::regclass);


--
-- Name: pagos_inscripcion id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos_inscripcion ALTER COLUMN id SET DEFAULT nextval('clasico_bd.pagos_inscripcion_id_seq'::regclass);


--
-- Name: pagos_ventas id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos_ventas ALTER COLUMN id SET DEFAULT nextval('clasico_bd.pagos_ventas_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.productos ALTER COLUMN id SET DEFAULT nextval('clasico_bd.productos_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.proveedores ALTER COLUMN id SET DEFAULT nextval('clasico_bd.proveedores_id_seq'::regclass);


--
-- Name: reservas_fijas id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.reservas_fijas ALTER COLUMN id SET DEFAULT nextval('clasico_bd.reservas_fijas_id_seq'::regclass);


--
-- Name: torneos id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.torneos ALTER COLUMN id SET DEFAULT nextval('clasico_bd.torneos_id_seq'::regclass);


--
-- Name: turnos id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.turnos ALTER COLUMN id SET DEFAULT nextval('clasico_bd.turnos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.usuarios ALTER COLUMN id SET DEFAULT nextval('clasico_bd.usuarios_id_seq'::regclass);


--
-- Name: ventas id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.ventas ALTER COLUMN id SET DEFAULT nextval('clasico_bd.ventas_id_seq'::regclass);


--
-- Name: ventas_cantina id; Type: DEFAULT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.ventas_cantina ALTER COLUMN id SET DEFAULT nextval('clasico_bd.ventas_cantina_id_seq'::regclass);


--
-- Name: cajas cajas_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.cajas
    ADD CONSTRAINT cajas_pkey PRIMARY KEY (id);


--
-- Name: canchas canchas_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.canchas
    ADD CONSTRAINT canchas_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_descripcion_key; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.categorias
    ADD CONSTRAINT categorias_descripcion_key UNIQUE (descripcion);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (clave);


--
-- Name: detalle_compra detalle_compra_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_compra
    ADD CONSTRAINT detalle_compra_pkey PRIMARY KEY (id);


--
-- Name: detalle_venta_cantina detalle_venta_cantina_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_venta_cantina
    ADD CONSTRAINT detalle_venta_cantina_pkey PRIMARY KEY (id);


--
-- Name: detalle_ventas detalle_ventas_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_ventas
    ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);


--
-- Name: gastos gastos_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.gastos
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);


--
-- Name: inscripciones inscripciones_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.inscripciones
    ADD CONSTRAINT inscripciones_pkey PRIMARY KEY (id);


--
-- Name: inscripciones inscripciones_torneo_id_jugador_id_key; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.inscripciones
    ADD CONSTRAINT inscripciones_torneo_id_jugador_id_key UNIQUE (torneo_id, jugador_id);


--
-- Name: jugadores jugadores_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.jugadores
    ADD CONSTRAINT jugadores_pkey PRIMARY KEY (id);


--
-- Name: movimientos_cuenta movimientos_cuenta_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_cuenta
    ADD CONSTRAINT movimientos_cuenta_pkey PRIMARY KEY (id);


--
-- Name: movimientos_proveedor movimientos_proveedor_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_proveedor
    ADD CONSTRAINT movimientos_proveedor_pkey PRIMARY KEY (id);


--
-- Name: pagos_inscripcion pagos_inscripcion_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos_inscripcion
    ADD CONSTRAINT pagos_inscripcion_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pagos_ventas pagos_ventas_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos_ventas
    ADD CONSTRAINT pagos_ventas_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: reservas_fijas reservas_fijas_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.reservas_fijas
    ADD CONSTRAINT reservas_fijas_pkey PRIMARY KEY (id);


--
-- Name: torneos torneos_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.torneos
    ADD CONSTRAINT torneos_pkey PRIMARY KEY (id);


--
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: ventas_cantina ventas_cantina_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.ventas_cantina
    ADD CONSTRAINT ventas_cantina_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: cajas cajas_usuario_apertura_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.cajas
    ADD CONSTRAINT cajas_usuario_apertura_id_fkey FOREIGN KEY (usuario_apertura_id) REFERENCES clasico_bd.usuarios(id);


--
-- Name: cajas cajas_usuario_cierre_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.cajas
    ADD CONSTRAINT cajas_usuario_cierre_id_fkey FOREIGN KEY (usuario_cierre_id) REFERENCES clasico_bd.usuarios(id);


--
-- Name: compras compras_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.compras
    ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES clasico_bd.proveedores(id);


--
-- Name: detalle_compra detalle_compra_compra_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_compra
    ADD CONSTRAINT detalle_compra_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES clasico_bd.compras(id) ON DELETE CASCADE;


--
-- Name: detalle_compra detalle_compra_producto_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_compra
    ADD CONSTRAINT detalle_compra_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES clasico_bd.productos(id);


--
-- Name: detalle_venta_cantina detalle_venta_cantina_producto_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_venta_cantina
    ADD CONSTRAINT detalle_venta_cantina_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES clasico_bd.productos(id);


--
-- Name: detalle_venta_cantina detalle_venta_cantina_venta_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_venta_cantina
    ADD CONSTRAINT detalle_venta_cantina_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES clasico_bd.ventas_cantina(id);


--
-- Name: detalle_ventas detalle_ventas_producto_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_ventas
    ADD CONSTRAINT detalle_ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES clasico_bd.productos(id);


--
-- Name: detalle_ventas detalle_ventas_venta_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.detalle_ventas
    ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES clasico_bd.ventas(id) ON DELETE CASCADE;


--
-- Name: gastos gastos_caja_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.gastos
    ADD CONSTRAINT gastos_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES clasico_bd.cajas(id);


--
-- Name: gastos gastos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.gastos
    ADD CONSTRAINT gastos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES clasico_bd.usuarios(id);


--
-- Name: inscripciones inscripciones_caja_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.inscripciones
    ADD CONSTRAINT inscripciones_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES clasico_bd.cajas(id);


--
-- Name: inscripciones inscripciones_jugador_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.inscripciones
    ADD CONSTRAINT inscripciones_jugador_id_fkey FOREIGN KEY (jugador_id) REFERENCES clasico_bd.jugadores(id);


--
-- Name: inscripciones inscripciones_torneo_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.inscripciones
    ADD CONSTRAINT inscripciones_torneo_id_fkey FOREIGN KEY (torneo_id) REFERENCES clasico_bd.torneos(id);


--
-- Name: movimientos_cuenta movimientos_cuenta_caja_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_cuenta
    ADD CONSTRAINT movimientos_cuenta_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES clasico_bd.cajas(id);


--
-- Name: movimientos_cuenta movimientos_cuenta_jugador_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_cuenta
    ADD CONSTRAINT movimientos_cuenta_jugador_id_fkey FOREIGN KEY (jugador_id) REFERENCES clasico_bd.jugadores(id) ON DELETE CASCADE;


--
-- Name: movimientos_proveedor movimientos_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.movimientos_proveedor
    ADD CONSTRAINT movimientos_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES clasico_bd.proveedores(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_caja_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos
    ADD CONSTRAINT pagos_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES clasico_bd.cajas(id);


--
-- Name: pagos_inscripcion pagos_inscripcion_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos_inscripcion
    ADD CONSTRAINT pagos_inscripcion_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES clasico_bd.inscripciones(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_turno_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos
    ADD CONSTRAINT pagos_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES clasico_bd.turnos(id);


--
-- Name: pagos_ventas pagos_ventas_venta_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.pagos_ventas
    ADD CONSTRAINT pagos_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES clasico_bd.ventas_cantina(id) ON DELETE CASCADE;


--
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES clasico_bd.proveedores(id) ON DELETE SET NULL;


--
-- Name: reservas_fijas reservas_fijas_cancha_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.reservas_fijas
    ADD CONSTRAINT reservas_fijas_cancha_id_fkey FOREIGN KEY (cancha_id) REFERENCES clasico_bd.canchas(id);


--
-- Name: turnos turnos_cancha_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.turnos
    ADD CONSTRAINT turnos_cancha_id_fkey FOREIGN KEY (cancha_id) REFERENCES clasico_bd.canchas(id);


--
-- Name: ventas_cantina ventas_cantina_caja_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.ventas_cantina
    ADD CONSTRAINT ventas_cantina_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES clasico_bd.cajas(id);


--
-- Name: ventas_cantina ventas_cantina_turno_id_fkey; Type: FK CONSTRAINT; Schema: clasico_bd; Owner: postgres
--

ALTER TABLE ONLY clasico_bd.ventas_cantina
    ADD CONSTRAINT ventas_cantina_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES clasico_bd.turnos(id);


--
-- PostgreSQL database dump complete
--

\unrestrict qQjRz01BQk4vOmPGXQcb2qS8UA5x4WqhLO9f1Z9DkR2lOFIWxIsjYh4hJnYmDOX

