import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';

export const AdminConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-md rounded-2xl border border-[#E3DCCF] bg-white p-6 shadow-xl">
      <AlertDialogHeader>
        <AlertDialogTitle className="font-['Playfair_Display'] text-xl font-bold text-[#2D241E]">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-[#5C4B40]">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="mt-2 gap-2">
        <AlertDialogCancel className="rounded-lg border border-[#E3DCCF] bg-white px-4 py-2.5 text-sm font-semibold text-[#2D241E] hover:border-[#C25934]">
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
            destructive ? 'bg-[#D94848] hover:bg-[#B93E3E]' : 'bg-[#C25934] hover:bg-[#A84C2A]'
          }`}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
