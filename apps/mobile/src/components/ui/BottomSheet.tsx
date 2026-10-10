import { Modal } from 'react-native';
import { SheetSurface, type SheetSurfaceProps } from './SheetSurface';

export interface BottomSheetProps extends SheetSurfaceProps {
  readonly visible: boolean;
}

/** Bottom sheet / dialog dựa trên `Modal` của React Native (picker, xác nhận…). */
export function BottomSheet({ visible, onClose, ...surfaceProps }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={surfaceProps.placement === 'center' ? 'fade' : 'slide'}
      onRequestClose={onClose} // nút back Android
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SheetSurface onClose={onClose} {...surfaceProps} />
    </Modal>
  );
}
