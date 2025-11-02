import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';

export default function ProcessingDialog({ open, message }: { open: boolean; message: string }) {
  return (
    <Dialog open={open}>
      <DialogTitle>
        {message}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <CircularProgress />
        </div>
      </DialogTitle>
    </Dialog>
  );
}