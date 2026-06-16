import { useState } from "react";
import { Info, MapPin, Dot, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const logoUrl = `${import.meta.env.BASE_URL}images/rioz-logo.jpg`;

export function AboutDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Info className="h-3.5 w-3.5" />
          Sobre
        </button>
      </DialogTrigger>
      <DialogContent className="thin-scroll max-h-[85vh] overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-left">
            <img
              src={logoUrl}
              alt="Instituto Rios e Raízes"
              className="h-9 w-9 rounded-full ring-1 ring-border"
            />
            <span className="text-lg font-bold text-foreground">Sobre o painel</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Este painel foi desenvolvido para reunir, organizar e visualizar informações sobre Povos
            e Comunidades Tradicionais no Estado da Bahia, a partir do cruzamento de diferentes
            bases de dados públicas e institucionais.
          </p>
          <p>
            A proposta é oferecer uma leitura integrada sobre a quantidade, diversidade e
            distribuição territorial dessas comunidades, permitindo a visualização por município,
            RPGA/bacia, segmento da comunidade, fonte do dado e natureza da informação espacial
            disponível.
          </p>

          <div>
            <p className="mb-2 font-semibold text-foreground">
              Os registros foram classificados conforme o tipo de dado espacial associado:
            </p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                <span>
                  <strong className="text-foreground">Poligonal:</strong> quando há delimitação
                  territorial disponível;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy" />
                <span>
                  <strong className="text-foreground">Ponto:</strong> quando há coordenada de
                  localização;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Dot className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                <span>
                  <strong className="text-foreground">Somente município:</strong> quando a
                  informação disponível permite identificar apenas o município de ocorrência.
                </span>
              </li>
            </ul>
          </div>

          <p>
            Os registros classificados como “somente município” não possuem coordenada ou poligonal
            específica; por isso, sua representação ocorre apenas no agregado municipal. A
            associação desses registros à RPGA/bacia tem caráter aproximado, derivado da localização
            do município.
          </p>
          <p>
            RPGA significa{" "}
            <strong className="text-foreground">Região de Planejamento e Gestão das Águas</strong>,
            uma unidade territorial usada para planejamento e gestão dos recursos hídricos.
          </p>
          <p>
            O painel busca apoiar análises territoriais, planejamento, pesquisa, gestão ambiental e
            ações voltadas à proteção dos Povos e Comunidades Tradicionais da Bahia.
          </p>

          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-foreground">
            <div>
              <span className="text-muted-foreground">Versão:</span> 1.0
            </div>
            <div>
              <span className="text-muted-foreground">Autoria:</span> Valdenir Barbosa
            </div>
            <div className="font-semibold">Instituto Rios e Raízes</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
