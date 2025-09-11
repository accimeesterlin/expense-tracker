"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalTitle,
} from "./ui/Modal";
import { Button } from "./ui/Button";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title = "Error",
  message,
}: ErrorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        onClose={onClose}
      >
        <ModalTitle className="text-red-800">{title}</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <p className="text-gray-700">{message}</p>
      </ModalContent>

      <ModalFooter>
        <Button onClick={onClose} variant="primary" className="w-full">
          OK
        </Button>
      </ModalFooter>
    </Modal>
  );
}
