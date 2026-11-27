-- Preço e data da consulta no cartão de produto afiliado (27/11/2026, pedido do Pedro:
-- o cartão tem de parecer anúncio de produto, com foto e preço do Mercado Livre).
ALTER TABLE public.produtos_afiliados ADD COLUMN IF NOT EXISTS preco numeric(10,2) CHECK (preco IS NULL OR preco > 0);
ALTER TABLE public.produtos_afiliados ADD COLUMN IF NOT EXISTS preco_em date;
