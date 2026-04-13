import { OvertimeRecord } from "@/app/overtime/types";
import { formatRawDuration } from "@/app/overtime/utils";
import {
  DeleteButton,
  EditButton,
  MutedPrefix,
  RecordActions,
  RecordInfo,
  RecordItem,
} from "@/app/overtime/components/styles";

interface RecordItemRowProps {
  record: OvertimeRecord;
  showDate?: boolean;
  isDisabled?: boolean;
  onEdit: (record: OvertimeRecord) => void;
  onDelete: (id: string) => void;
}

export default function RecordItemRow({
  record,
  showDate = false,
  isDisabled = false,
  onEdit,
  onDelete,
}: RecordItemRowProps) {
  return (
    <RecordItem>
      <RecordInfo>
        {showDate && <strong>{record.date}</strong>}
        <span>
          <MutedPrefix>10시 전</MutedPrefix>
          {formatRawDuration(record.before10Minutes)}
        </span>
        <span>
          <MutedPrefix>10시 이후</MutedPrefix>
          {formatRawDuration(record.after10Minutes)}
        </span>
      </RecordInfo>
      <RecordActions>
        <EditButton
          type="button"
          onClick={() => onEdit(record)}
          disabled={isDisabled}
        >
          수정
        </EditButton>
        <DeleteButton
          type="button"
          onClick={() => onDelete(record.id)}
          disabled={isDisabled}
        >
          삭제
        </DeleteButton>
      </RecordActions>
    </RecordItem>
  );
}
