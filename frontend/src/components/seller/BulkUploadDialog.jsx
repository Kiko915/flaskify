import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Download, Upload, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/utils/AuthContext"

const BulkUploadDialog = ({ isOpen, onClose, shopUuid, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const { user } = useAuth()

  const downloadTemplate = () => {
    // Example products with variations
    const exampleProducts = [
      // Gaming Laptop with RAM variations
      {
        name: "ROG Strix G17 Gaming Laptop AMD Ryzen 9 7945HX RTX 4080 165Hz",
        description: "Experience unparalleled gaming performance with the ROG Strix G17. Powered by AMD Ryzen 9 7945HX and NVIDIA RTX 4080 featuring a stunning 165Hz display for smooth gameplay. Perfect for hardcore gamers and content creators.",
        price: "2999.99",
        quantity: "1",
        category_uuid: "gaming-laptops",
        sku: "ROG-G17-R9-4080",
        brand: "ASUS ROG",
        tags: "gaming|laptop|AMD|NVIDIA|RTX4080",
        specifications: "CPU:AMD Ryzen 9 7945HX|GPU:NVIDIA RTX 4080|Display:17.3 inch 165Hz|Storage:2TB NVMe SSD",
        variation_name: "RAM",
        variation_values: "16GB:2999.99:5|32GB:3299.99:3|64GB:3799.99:2",
        main_image: "https://example.com/rog-strix-g17-main.jpg",
        additional_images: "https://example.com/rog-strix-g17-1.jpg|https://example.com/rog-strix-g17-2.jpg",
        shipping_provider: "J&T Express",
        shipping_rate: "standard",
        shipping_length: "15.6",
        shipping_width: "10.2",
        shipping_height: "1.1",
        shipping_weight: "3.2"
      },
      // Gaming Mouse with Color variations
      {
        name: "ROG Chakram X Gaming Mouse with Wireless Charging and Programmable Joystick",
        description: "Professional gaming mouse featuring wireless charging programmable joystick and customizable RGB lighting. Equipped with high-precision optical sensor and wireless connectivity for lag-free gaming.",
        price: "159.99",
        quantity: "1",
        category_uuid: "gaming-peripherals",
        sku: "ROG-CHAKRAM-X",
        brand: "ASUS ROG",
        tags: "gaming|mouse|wireless|RGB",
        specifications: "DPI:36000|Switches:ROG Optical|Battery:70hrs|Weight:127g",
        variation_name: "Color",
        variation_values: "Black:159.99:20|White:159.99:15|Gunmetal:169.99:10",
        main_image: "https://example.com/rog-chakram-main.jpg",
        additional_images: "https://example.com/rog-chakram-1.jpg|https://example.com/rog-chakram-2.jpg",
        shipping_provider: "J&T Express",
        shipping_rate: "standard",
        shipping_length: "5",
        shipping_width: "3",
        shipping_height: "2",
        shipping_weight: "0.3"
      }
    ]

    // Convert examples to CSV format
    const headers = [
      'name',
      'description',
      'price',
      'quantity',
      'category_uuid',
      'sku',
      'brand',
      'tags',
      'specifications',
      'variation_name',
      'variation_values',
      'main_image',
      'additional_images',
      'shipping_provider',
      'shipping_rate',
      'shipping_length',
      'shipping_width',
      'shipping_height',
      'shipping_weight'
    ]

    const rows = exampleProducts.map(product => 
      headers.map(header => product[header] || '').join(',')
    )

    const csvContent = [headers.join(','), ...rows].join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_upload_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type !== 'text/csv') {
      toast.error('Please upload a CSV file')
      return
    }
    setFile(file)
    setValidationErrors([])
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    if (!user?.seller?.seller_id) {
      toast.error('Seller information not found. Please make sure you are logged in as a seller.')
      return
    }

    setUploading(true)
    setValidationErrors([])

    const formData = new FormData()
    formData.append('file', file)

    const backendUrl = `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/bulk-upload`
    console.log('Uploading to:', backendUrl)

    try {
      // First check if server is reachable
      const healthCheck = await fetch('http://localhost:5555/health', { 
        method: 'GET',
        credentials: 'include'
      }).catch(() => null)

      if (!healthCheck) {
        throw new Error('Backend server is not running. Please start the server and try again.')
      }

      const response = await fetch(backendUrl, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setValidationErrors(data.errors)
          toast.error('Validation errors found in CSV file')
        } else {
          throw new Error(data.message || 'Failed to upload products')
        }
        return
      }

      toast.success(`Successfully uploaded ${data.products_created} products`)
      onSuccess(data)
      onClose()
    } catch (error) {
      console.error('Error uploading products:', error)
      if (error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please make sure the backend is running.')
      } else {
        toast.error(error.message || 'Failed to upload products')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Upload a CSV file following the template format. Required fields:</p>
              <ul className="list-disc pl-4">
                <li>name (min 20 chars)</li>
                <li>description (min 100 chars)</li>
                <li>price (number)</li>
                <li>quantity (whole number)</li>
                <li>category_uuid</li>
                <li>shipping_provider (e.g., "J&T Express")</li>
                <li>shipping_rate (e.g., "standard", "express")</li>
              </ul>
              <p className="mt-2 font-medium">Format Examples:</p>
              <ul className="list-disc pl-4">
                <li>Specifications: <code>CPU:Ryzen 9|GPU:RTX 4080|RAM:32GB</code></li>
                <li>Variations: <code>16GB:2999.99:5|32GB:3299.99:3|64GB:3799.99:2</code></li>
                <li>Tags: <code>gaming|laptop|AMD</code></li>
                <li>Additional Images: <code>url1.jpg|url2.jpg|url3.jpg</code></li>
              </ul>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <h4 className="font-medium">Validation Errors:</h4>
                <ul className="list-disc pl-4 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Products'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BulkUploadDialog 