import { TextField, type TextFieldProps } from './TextField';

export type TextAreaProps = Omit<TextFieldProps, 'multiline' | 'icon' | 'trailing'>;

/** Ô nhập nhiều dòng (ghi chú, nội dung). */
export function TextArea(props: TextAreaProps) {
  return <TextField multiline scrollEnabled={false} {...props} />;
}
