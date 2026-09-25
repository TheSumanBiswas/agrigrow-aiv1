import { Globe, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n/translations";

interface LanguageSwitcherProps {
  className?: string;
  fullWidth?: boolean;
}

const LanguageSwitcher = ({ className = "", fullWidth = false }: LanguageSwitcherProps) => {
  const { lang, setLang, t } = useLanguage();
  const current = languages.find((l) => l.code === lang) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("lang.label")}
          className={`${fullWidth ? "w-full justify-start" : ""} gap-2 ${className}`}
        >
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-medium">{current.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[60] min-w-[180px] max-h-[60vh] overflow-y-auto bg-popover">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{l.flag}</span>
              <span>{l.native}</span>
            </span>
            {l.code === lang && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
