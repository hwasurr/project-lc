import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from '@chakra-ui/react';
import PasswordCheckForm from './PasswordCheckForm';

export type DialogProps = Pick<ModalProps, 'isOpen' | 'onClose'> & {
  headerText?: string;
  onConfirm: () => void;
};

export function PasswordCheckDialog(props: DialogProps): JSX.Element {
  const { isOpen, onClose, headerText, onConfirm } = props;
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        {headerText && <ModalHeader>{headerText}</ModalHeader>}
        <ModalCloseButton />
        <ModalBody>
          <PasswordCheckForm onCancel={onClose} onConfirm={onConfirm} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default PasswordCheckDialog;
