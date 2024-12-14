import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const SessionExpiredDialog = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  const handleClose = () => {
    onClose()
    // Clear any auth data
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    // Redirect to login
    navigate("/auth/login")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Your session has expired. Please log in again to continue.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SessionExpiredDialog 