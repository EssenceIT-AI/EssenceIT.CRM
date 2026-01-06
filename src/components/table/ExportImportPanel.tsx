import { useSchemaStore, useDataStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Upload,
  RefreshCw,
  Database,
  FileJson,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportImportPanelProps {
  tableId: string;
}

export const ExportImportPanel = ({ tableId }: ExportImportPanelProps) => {
  const { toast } = useToast();
  const { getSchema, resetSchemas } = useSchemaStore();
  const { getTableData, reseedData } = useDataStore();

  const schema = getSchema(tableId);
  const data = getTableData(tableId);

  const downloadJson = (content: object, filename: string) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSchema = () => {
    if (!schema) return;
    downloadJson(schema, `schema.${tableId}.json`);
    toast({
      title: "Schema exportado",
      description: `Arquivo schema.${tableId}.json baixado`,
    });
  };

  const handleExportData = () => {
    downloadJson(data, `data.${tableId}.json`);
    toast({
      title: "Dados exportados",
      description: `Arquivo data.${tableId}.json baixado`,
    });
  };

  const handleExportAll = () => {
    const exportData = {
      schema,
      data,
      exportedAt: new Date().toISOString(),
    };
    downloadJson(exportData, `export.${tableId}.json`);
    toast({
      title: "Exportação completa",
      description: `Schema e dados exportados para export.${tableId}.json`,
    });
  };

  const handleReloadFromMock = () => {
    const confirmed = window.confirm(
      "Isso irá recarregar todos os dados do mock inicial. As alterações serão perdidas. Continuar?"
    );
    if (!confirmed) return;

    resetSchemas();
    reseedData();
    toast({
      title: "Dados recarregados",
      description: "Schema e dados restaurados do mock inicial",
    });
  };

  const handleApplyChanges = () => {
    // In this mock setup, changes are already persisted to localStorage
    // This button serves as confirmation feedback
    toast({
      title: "Alterações aplicadas",
      description: "As mudanças foram salvas no armazenamento local",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Dados
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleApplyChanges}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aplicar alterações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportSchema}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar schema
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Exportar dados
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" />
          Exportar tudo (schema + dados)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleReloadFromMock}
          className="text-destructive focus:text-destructive"
        >
          <Upload className="h-4 w-4 mr-2" />
          Recarregar do mock
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
