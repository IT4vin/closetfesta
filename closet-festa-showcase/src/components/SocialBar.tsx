
import { useAppContext } from "@/context/AppContext";
import { Instagram, MessageCircle, ShoppingBag } from "lucide-react";

const SocialBar = () => {
  const { storeInfo } = useAppContext();
  
  const socialLinks = [
    {
      name: "WhatsApp",
      url: `https://wa.me/${storeInfo.contacts.whatsapp}`,
      icon: MessageCircle,
      color: "bg-green-500",
    },
    {
      name: "Instagram",
      url: `https://instagram.com/${storeInfo.contacts.instagram}`,
      icon: Instagram,
      color: "bg-[#E1306C]",
    },
  ];
  
  if (storeInfo.contacts.shopee) {
    socialLinks.push({
      name: "Shopee",
      url: `https://shopee.com.br/${storeInfo.contacts.shopee}`,
      icon: ShoppingBag,
      color: "bg-orange-500",
    });
  }
  
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-10">
      {socialLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link.color} text-white p-3 rounded-full shadow-lg hover:opacity-90 transition-opacity`}
          aria-label={link.name}
        >
          <link.icon size={24} />
        </a>
      ))}
    </div>
  );
};

export default SocialBar;
